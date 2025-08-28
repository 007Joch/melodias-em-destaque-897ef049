// Página de pré-visualização do verso
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getVerse, getRelatedVerses, Verse, getVersesByIds } from '@/services/versesService';
import { hasUserPurchasedVerse } from '@/services/purchaseService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Video, Calendar, Music, User, ShoppingCart, Lock, Type, Loader2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import CheckoutFlow from '@/components/CheckoutFlow';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/hooks/useCart';
import { DEFAULT_VERSE_IMAGE } from '@/constants/images';

const PreVerse = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [relatedVerses, setRelatedVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart, openCartToStep } = useCart();

  // Validação se o ID é numérico
  const isValidVerseId = (id: string) => /^\d+$/.test(id);

  useEffect(() => {
    const fetchVerse = async () => {
      if (!id || !isValidVerseId(id)) {
        setError('ID da versão inválido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar o verso
        const verseData = await getVerse(id);
        if (!verseData) {
          setError('Versão não encontrada');
          setLoading(false);
          return;
        }

        setVerse(verseData);

        // Verificar acesso baseado no tipo de usuário
        if (user) {
          setCheckingPurchase(true);
          const userRole = profile?.role;
          
          // Admin e Membro têm acesso direto
          if (userRole === 'admin' || userRole === 'membro') {
            navigate(`/verse/${verseData.id}`, { replace: true });
            return;
          }
          
          // Para clientes, verificar se compraram o verso
          const hasPurchased = await hasUserPurchasedVerse(user.id, parseInt(id));
          if (hasPurchased) {
            // Redirecionar para a página completa do verso
            navigate(`/verse/${verseData.id}`, { replace: true });
            return;
          }
          setCheckingPurchase(false);
        }

        // Buscar versões irmãs se existirem
        if (verseData.versoes_irmas && verseData.versoes_irmas.length > 0) {
          try {
            const relatedData = await getVersesByIds(verseData.versoes_irmas);
            setRelatedVerses(relatedData);
          } catch (err) {
            console.error('Erro ao carregar versões irmãs:', err);
            setRelatedVerses([]);
          }
        } else {
          // Se não há versões irmãs, não exibir nada
          setRelatedVerses([]);
        }

      } catch (err) {
        console.error('Erro ao carregar verso:', err);
        setError('Erro ao carregar o verso');
      } finally {
        setLoading(false);
      }
    };

    fetchVerse();
  }, [id, user, navigate]);

  const handlePurchaseSuccess = () => {
    // Redirecionar para a página "Meus Pedidos" após compra bem-sucedida
    // Conforme solicitado: admin, membros e clientes devem ir para "Meus Pedidos"
    navigate('/meus-pedidos', { replace: true });
  };

  // Função para validar imagem (mesma lógica do MusicCard)
  const getValidImage = (image: string | null | undefined) => {
    console.log('🖼️ [PreVerse] Verificando imagem para o verso:', { id, title: verse?.titulo_pt_br || verse?.titulo_original, image });
    
    if (!image || image.trim() === '' || image === 'null') {
      console.log('❌ [PreVerse] Imagem inválida ou vazia, usando genérica');
      return DEFAULT_VERSE_IMAGE;
    }
    
    // Se a imagem contém o path do bucket capas ou é do Supabase, usar ela
    if (image.includes('/capas/') || image.includes('supabase.co') || image.includes('hlrcvvaneofcpncbqjyg')) {
      console.log('✅ [PreVerse] Imagem válida do Supabase:', image);
      return image;
    }
    
    // Se for uma URL externa válida, usar ela
    if (image.startsWith('http')) {
      console.log('✅ [PreVerse] URL externa válida:', image);
      return image;
    }
    
    console.log('⚠️ [PreVerse] Imagem não reconhecida, usando genérica:', image);
    return DEFAULT_VERSE_IMAGE;
  };

  const handleAddToCart = async () => {
    if (!verse) return;
    
    // Usar apenas titulo_original como na HomePage para manter consistência
    const title = (verse.titulo_original || '').trim();
    if (!title) {
      console.error('Verso sem título válido, não pode ser adicionado ao carrinho');
      return;
    }
    
    try {
      setIsAddingToCart(true);
      
      // Usar a mesma lógica de ID do MusicCard para evitar duplicações
      const verseId = verse.id ? String(verse.id) : `${title}-${verse.musical || ''}`.toLowerCase().replace(/\s+/g, '-');
      
      const cartItem = {
        id: verseId,
        title: title,
        artist: verse.musical || '',
        category: verse.classificacao_vocal_alt && Array.isArray(verse.classificacao_vocal_alt) && verse.classificacao_vocal_alt.length > 0 ? verse.classificacao_vocal_alt.join(', ') : 'Musical',
        price: verse.valor || 15.00,
        image: getValidImage(verse.url_imagem)
      };
      
      console.log('Adicionando ao carrinho via PreVerse:', cartItem);
      addToCart(cartItem);
      
      // Abrir o carrinho automaticamente na etapa do carrinho
      openCartToStep('cart');
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    // Adicionar ao carrinho e só depois seguir para o checkout
    await handleAddToCart();
    openCartToStep('address');
  };

  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const isValidData = (data: any): boolean => {
    return data !== null && data !== undefined && data !== '';
  };

  const displayData = (data: any, fallback: string = 'Não informado'): string => {
    return isValidData(data) ? String(data) : fallback;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Carregando versão...</p>
        </div>
      </div>
    );
  }

  if (error || !verse) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Versão não encontrada'}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (checkingPurchase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  const youtubeId = verse.audio_original ? extractYouTubeId(verse.audio_original) : null;

  // Função para extrair ID do YouTube (mesma da VerseDetails)
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
        
      <main className="container mx-auto px-4 sm:px-6 py-6">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">

          {/* Conteúdo Principal - Informações da Versão */}
          <div className="space-y-6 lg:col-span-4 lg:order-2">
            {/* Cabeçalho */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {displayData(verse.titulo_original || verse.titulo_pt_br, 'Título')}
              </h1>
              <p className="text-xl text-gray-600 mb-4">{verse.musical || 'Musical'}</p>

            </div>


            {/* Informações do Musical */}
            <Card className="p-6 border-0 bg-gradient-to-r from-primary/5 to-purple-50 rounded-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Music className="w-5 h-5 mr-2 text-primary" />
                Informações da Versão
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Título em Português */}
                {isValidData(verse.titulo_pt_br) && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Título em Português:</span>
                    <p className="text-gray-900 font-medium">{displayData(verse.titulo_pt_br)}</p>
                  </div>
                )}
                
                {/* Origem */}
                {isValidData(verse.origem) && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Origem:</span>
                    <p className="text-gray-900 font-medium">{verse.origem}</p>
                  </div>
                )}
                
                {/* Música de */}
                {isValidData(verse.compositor) && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Música de:</span>
                    <p className="text-gray-900 font-medium">{displayData(verse.compositor)}</p>
                  </div>
                )}
                
                {/* Letra original de */}
                {isValidData(verse.letrista) && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Letra original de:</span>
                    <p className="text-gray-900">{displayData(verse.letrista)}</p>
                  </div>
                )}
                
                {/* Versão brasileira de */}
                {isValidData(verse.versionista) && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Versão brasileira de:</span>
                    <p className="text-gray-900">{displayData(verse.versionista)}</p>
                  </div>
                )}
                
                {/* Texto revisado por */}
                {isValidData(verse.revisao) && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Texto revisado por:</span>
                    <p className="text-gray-900">{displayData(verse.revisao)}</p>
                  </div>
                )}
                
                {/* Versionado em */}
                <div>
                  <span className="text-sm font-medium text-gray-600">Versionado em:</span>
                  <p className="text-gray-900">{verse.versionado_em ? (() => {
                      const [year, month, day] = verse.versionado_em.split('-');
                      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('pt-BR');
                    })() : 'Data não disponível'}</p>
                </div>
              </div>
              
              {/* Versão baseada na gravação de - Aviso centralizado */}
              {(isValidData(verse.ano_gravacao) || isValidData(verse.elenco)) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-600 italic">
                    Versão baseada na gravação de {[verse.ano_gravacao, verse.elenco].filter(Boolean).join(' ')}
                  </p>
                </div>
              )}
            </Card>

            {/* Seção Unificada: Classificação Vocal, Estilo, Natureza e Dificuldade */}
            {((verse.classificacao_vocal_alt && Array.isArray(verse.classificacao_vocal_alt) && verse.classificacao_vocal_alt.length > 0) ||
              (verse.estilo && verse.estilo.length > 0) ||
              (verse.natureza && verse.natureza.length > 0) ||
              (verse.dificuldade && typeof verse.dificuldade === 'number')) && (
              <Card className="p-6 border-0 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl">
                <div className="space-y-4">
                  {/* Classificação Vocal */}
                  {verse.classificacao_vocal_alt && Array.isArray(verse.classificacao_vocal_alt) && verse.classificacao_vocal_alt.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Classificação Vocal</h3>
                      <div className="flex flex-wrap gap-2">
                        {verse.classificacao_vocal_alt.map((classificacao, index) => (
                          <span key={index} className="inline-block px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
                            {classificacao}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Estilo */}
                  {verse.estilo && verse.estilo.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Estilo</h3>
                      <div className="flex flex-wrap gap-2">
                        {verse.estilo.map((item, index) => (
                          <span key={index} className="inline-block px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Natureza */}
                  {verse.natureza && verse.natureza.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Natureza</h3>
                      <div className="flex flex-wrap gap-2">
                        {verse.natureza.map((item, index) => (
                          <span key={index} className="inline-block px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dificuldade */}
                  {verse.dificuldade && typeof verse.dificuldade === 'number' && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Dificuldade</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-block px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
                          {verse.dificuldade} de 5
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar - Mini-player, Versões Irmãs e Botão de Compra */}
          <div className="space-y-4 lg:col-span-3 lg:order-1">
            {/* Aviso antes do vídeo */}
            {isValidData(verse.audio_original) && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Verifique por meio do vídeo abaixo, em inglês, se você está adquirindo a versão correta da música que deseja.
                </p>
              </div>
            )}
            
            {/* Áudio Original */}
            {isValidData(verse.audio_original) ? (
              <Card className="overflow-hidden rounded-xl border-0 shadow-lg">
                <div className="p-3 bg-gradient-to-br from-red-50 to-pink-50">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Video className="w-5 h-5 mr-2 text-red-600" />
                    Áudio Original
                  </h2>
                  <div className="w-full rounded-lg overflow-hidden" style={{aspectRatio: '16/10'}}>
                    {(() => {
                      const youtubeId = getYouTubeId(verse.audio_original!);
                      if (youtubeId) {
                        return (
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            className="w-full h-full"
                            allowFullScreen
                            title={`Áudio: ${displayData(verse.titulo_original)}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        );
                      } else {
                        return (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <p className="text-gray-600">URL de vídeo inválida</p>
                          </div>
                        );
                      }
                    })()} 
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="overflow-hidden rounded-xl border-0 shadow-lg">
                <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Video className="w-5 h-5 mr-2 text-gray-600" />
                    Áudio Original
                  </h2>
                  <div className="w-full rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center" style={{aspectRatio: '16/10'}}>
                    <p className="text-gray-600 text-center">Áudio não disponível</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Seção Adquirindo esta versão você também terá acesso a */}
            {relatedVerses.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Adquirindo esta versão você também terá acesso a:</h3>
                <div className="space-y-2">
                  {relatedVerses.map((relatedVerse) => (
                    <button
                      key={relatedVerse.id}
                      onClick={() => navigate(`/preview/${relatedVerse.id}`)}
                      className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all duration-200"
                    >
                      <span className="text-primary font-medium hover:underline">
                        {displayData(relatedVerse.titulo_original, 'Título não disponível')}
                        {relatedVerse.musical_alt && ` - ${relatedVerse.musical_alt}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ações de Compra */}
            <Card className="p-0 border-0 bg-transparent shadow-none">
              <div className="text-center space-y-3 max-w-sm mx-auto">
                <Button 
                  onClick={handleBuyNow}
                  size="lg"
                  className="w-full rounded-full bg-primary hover:bg-primary/90 text-white"
                >
                  {`Comprar por R$ ${verse.valor ? verse.valor.toFixed(2).replace('.', ',') : '15,00'}`}
                </Button>
                <Button 
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  size="sm"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 rounded-full border-primary text-primary hover:bg-primary/10"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {isAddingToCart ? 'Adicionando...' : 'Adicionar ao carrinho'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
       </main>

      <Footer />

      {/* Checkout Flow */}
      {showCheckout && user && (
        <CheckoutFlow
          onBack={() => setShowCheckout(false)}
          onComplete={handlePurchaseSuccess}
        />
      )}
    </div>
  );
};

export default PreVerse;