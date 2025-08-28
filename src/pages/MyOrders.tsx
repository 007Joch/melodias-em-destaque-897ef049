import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserPurchases } from '@/services/purchaseService';
import { getVersesByIds, Verse } from '@/services/versesService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Music, Calendar, User, ArrowLeft, Package } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart, CartProvider } from '@/hooks/useCart';
import { DEFAULT_VERSE_IMAGE } from '@/constants/images';


const MyOrders = () => {
  const { user } = useAuth();
  const [purchasedVerses, setPurchasedVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchasedVerses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Buscar IDs dos versos comprados pelo usuário
        const purchasedVerseIds = await getUserPurchases(user.id);
        
        if (purchasedVerseIds.length === 0) {
          setPurchasedVerses([]);
          setLoading(false);
          return;
        }

        // Buscar detalhes dos versos
        const verses = await getVersesByIds(purchasedVerseIds);
        
        // Criar um Set para evitar duplicatas
        const uniqueVerses = new Map<number, Verse>();
        
        // Adicionar versos principais
        verses.forEach(verse => {
          uniqueVerses.set(verse.id, verse);
        });
        
        // Adicionar versões irmãs
        for (const verse of verses) {
          if (verse.versoes_irmas && verse.versoes_irmas.length > 0) {
            try {
              const siblingVerses = await getVersesByIds(verse.versoes_irmas);
              siblingVerses.forEach(siblingVerse => {
                uniqueVerses.set(siblingVerse.id, siblingVerse);
              });
            } catch (error) {
              console.error('Erro ao buscar versões irmãs:', error);
            }
          }
        }
        
        // Converter Map para array e ordenar alfabeticamente pelo título original
        const allVerses = Array.from(uniqueVerses.values())
          .sort((a, b) => {
            const titleA = (a.titulo_original || a.titulo_pt_br || '').toLowerCase();
            const titleB = (b.titulo_original || b.titulo_pt_br || '').toLowerCase();
            return titleA.localeCompare(titleB, 'pt-BR');
          });
        
        setPurchasedVerses(allVerses);
      } catch (error) {
        console.error('Erro ao buscar versos comprados:', error);
        setError('Erro ao carregar seus pedidos. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedVerses();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para obter imagem válida do verso
  const getValidImage = (image?: string) => {
    console.log('🖼️ [MyOrders] Verificando imagem:', image);
    
    if (!image || image.trim() === '' || image === 'null') {
      console.log('❌ [MyOrders] Imagem inválida ou vazia, usando genérica');
      return DEFAULT_VERSE_IMAGE;
    }
    
    // Se a imagem contém o path do bucket capas ou é do Supabase, usar ela
    if (image.includes('/capas/') || image.includes('supabase.co') || image.includes('hlrcvvaneofcpncbqjyg')) {
      console.log('✅ [MyOrders] Imagem válida do Supabase:', image);
      return image;
    }
    
    // Se for uma URL externa válida, usar ela
    if (image.startsWith('http')) {
      console.log('✅ [MyOrders] URL externa válida:', image);
      return image;
    }
    
    console.log('⚠️ [MyOrders] Imagem não reconhecida, usando genérica:', image);
    return DEFAULT_VERSE_IMAGE;
  };



  if (loading) {
    return (
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <LoadingSpinner />
            </div>
          </div>
          <Footer />
        </div>
      </CartProvider>
    );
  }

  if (!user) {
    return (
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <Card className="w-full max-w-md mx-4">
                <CardContent className="p-8 text-center">
                  <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
                  <p className="text-gray-600 mb-4">Você precisa estar logado para ver seus pedidos.</p>
                  <Link to="/login">
                    <Button className="w-full">
                      Fazer Login
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
          <Footer />
        </div>
      </CartProvider>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto px-4 sm:px-6 py-6">
          {/* Cabeçalho */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="rounded-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Meus Pedidos
              </h1>
            </div>
            

          </div>

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="mt-4"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!error && purchasedVerses.length === 0 && (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <Package className="w-20 h-20 mx-auto mb-6 text-gray-300" />
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">
                Nenhum pedido encontrado
              </h2>
              <p className="text-gray-500 mb-6 text-lg">
                Você ainda não adquiriu nenhuma versão
              </p>
              <Link to="/">
                <Button size="lg" className="px-8">
                  <Music className="w-5 h-5 mr-2" />
                  Encontrar versões
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Verses Grid */}
        {!error && purchasedVerses.length > 0 && (
          <>
            <div className="mb-6">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {purchasedVerses.length} {purchasedVerses.length === 1 ? 'versão disponível' : 'versões disponíveis'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchasedVerses.map((verse) => (
                <Card key={verse.id} className="group overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
                  {/* Layout horizontal - imagem pequena à esquerda */}
                  <div className="flex p-4">
                    {/* Coluna da imagem e valor */}
                    <div className="flex flex-col items-center mr-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 mb-2">
                        <img
                          src={getValidImage(verse.url_imagem)}
                          alt={verse.titulo_pt_br}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = DEFAULT_VERSE_IMAGE;
                          }}
                        />
                      </div>

                    </div>
                    
                    {/* Conteúdo principal */}
                    <div className="flex-1 min-w-0">
                      {/* Título e Musical */}
                      <Link to={`/verse/${verse.id}`} className="block">
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg hover:text-primary transition-colors mb-1">
                          {verse.titulo_original}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {verse.musical || 'Musical não informado'}
                      </p>
                      
                      {/* Tags de classificação vocal dinâmicas */}
                       {verse.classificacao_vocal_alt && verse.classificacao_vocal_alt.length > 0 && (
                         <div className="flex flex-wrap gap-2 mb-3">
                           {verse.classificacao_vocal_alt.map((classificacao, index) => (
                             <span 
                               key={index}
                               className="inline-block px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full"
                             >
                               {classificacao}
                             </span>
                           ))}
                         </div>
                       )}
                      
                      {/* Data de aquisição */}
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <Calendar className="w-3 h-3" />
                        <span>Adquirido em {formatDate(verse.criada_em || new Date().toISOString())}</span>
                      </div>
                      
                      {/* Botão ocupando toda a largura */}
                      <Link to={`/verse/${verse.id}`} className="block">
                        <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full py-2 text-sm font-medium transition-colors border border-gray-200">
                          Ver detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
        </main>
        
        <Footer />
      </div>
    </CartProvider>
  );
};

export default MyOrders;