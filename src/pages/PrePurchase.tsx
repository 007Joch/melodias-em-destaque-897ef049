import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Music, Share2, Video, Loader2, Type, ShoppingCart, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

import { getVerse, getVersesByIds } from '../services/versesService';
import { Database } from '../integrations/supabase/types';
import { DEFAULT_VERSE_IMAGE } from '@/constants/images';

type Verse = Database['public']['Tables']['versoes']['Row'];

// Função auxiliar para verificar se um valor é válido
const isValidData = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' && trimmed.toLowerCase() !== 'null' && trimmed !== 'undefined';
  }
  if (Array.isArray(value)) {
    return value.length > 0 && value.some(item => isValidData(item));
  }
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  return Boolean(value);
};

// Função para exibir dados com fallback
const displayData = (value: any, fallback: string = 'Não informado'): string => {
  if (!isValidData(value)) return fallback;
  
  if (Array.isArray(value)) {
    const validItems = value.filter(item => isValidData(item));
    return validItems.length > 0 ? validItems.join(', ') : fallback;
  }
  
  return String(value);
};

const PrePurchase = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { addToCart, openCartToStep } = useCart();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedVerses, setRelatedVerses] = useState<Verse[]>([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const fetchVerse = async () => {
      if (!id || isNaN(Number(id))) {
        console.error('❌ [PrePurchase] ID inválido na URL');
        setError('Identificador do verso inválido');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 [PrePurchase] Buscando verso com id:', id);
        const data = await getVerse(id);

        console.log('🔍 [PrePurchase] Resultado da busca:', data);

        if (data) {
          console.log('✅ [PrePurchase] Verso encontrado:', { id: data.id, titulo: data.titulo_pt_br || data.titulo_original });
          setVerse(data);

          if (data.versoes_irmas && data.versoes_irmas.length > 0) {
            try {
              const relatedData = await getVersesByIds(data.versoes_irmas);
              setRelatedVerses(relatedData);
            } catch (err) {
              console.error('[PrePurchase] Erro ao carregar versões irmãs:', err);
              setRelatedVerses([]);
            }
          } else {
            setRelatedVerses([]);
          }
        } else {
          console.error('❌ [PrePurchase] Verso não encontrado para id:', id);
          setError('Verso não encontrado');
        }
      } catch (err) {
        console.error('❌ [PrePurchase] Erro ao carregar verso:', err);
        setError('Erro ao carregar dados do verso');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerse();
  }, [id]);

  // Função para validar imagem (mesma lógica do MusicCard)
  const getValidImage = (image: string | null | undefined) => {
    console.log('🖼️ [PrePurchase] Verificando imagem para o verso:', { id, title: verse?.titulo_pt_br || verse?.titulo_original, image });
    
    if (!image || image.trim() === '' || image === 'null') {
      console.log('❌ [PrePurchase] Imagem inválida ou vazia, usando genérica');
      return DEFAULT_VERSE_IMAGE;
    }
    
    // Se a imagem contém o path do bucket capas ou é do Supabase, usar ela
    if (image.includes('/capas/') || image.includes('supabase.co') || image.includes('hlrcvvaneofcpncbqjyg')) {
      console.log('✅ [PrePurchase] Imagem válida do Supabase:', image);
      return image;
    }
    
    // Se for uma URL externa válida, usar ela
    if (image.startsWith('http')) {
      console.log('✅ [PrePurchase] URL externa válida:', image);
      return image;
    }
    
    console.log('⚠️ [PrePurchase] Imagem não reconhecida, usando genérica:', image);
    return DEFAULT_VERSE_IMAGE;
  };

  const handleAddToCart = async () => {
    if (!verse) return;
    
    // Validar se o verso tem título válido usando titulo_pt_br ou titulo_original
    const title = (verse.titulo_pt_br || verse.titulo_original || '').trim();
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
        category: verse.classificacao_vocal_alt && verse.classificacao_vocal_alt.length > 0 ? verse.classificacao_vocal_alt.join(', ') : 'Musical',
        price: verse.valor || 15.00,
        image: getValidImage(verse.url_imagem)
      };
      
      console.log('Adicionando ao carrinho via PrePurchase:', cartItem);
      addToCart(cartItem);
      
      // Abrir o carrinho diretamente na etapa de endereço
      openCartToStep('address');
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Função para extrair ID do YouTube
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Carregando versão...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (!verse) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Versão não encontrada</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
        
      <main className="container mx-auto px-4 sm:px-6 py-6">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={handleGoBack}
          className="mb-6 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Áudio Original */}
          <div className="space-y-4">
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

            {/* Áudio Brasileiro */}
            {isValidData((verse as any).audio_brasileiro) ? (
              <Card className="overflow-hidden rounded-xl border-0 shadow-lg">
                <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Video className="w-5 h-5 mr-2 text-green-600" />
                    Áudio Brasileiro
                  </h2>
                  <div className="w-full rounded-lg overflow-hidden" style={{aspectRatio: '16/10'}}>
                    {(() => {
                      const youtubeId = getYouTubeId((verse as any).audio_brasileiro as string);
                      if (youtubeId) {
                        return (
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            className="w-full h-full"
                            allowFullScreen
                            title={`Áudio Brasileiro: ${displayData(verse.titulo_pt_br || verse.titulo_original)}`}
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
            ) : null}

            {/* Seção Versões Irmãs */}
            {relatedVerses.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Adquirindo esta versão você também terá acesso a:</h3>
                <div className="space-y-2">
                  {relatedVerses.map((relatedVerse) => (
                    <button
                      key={relatedVerse.id}
                      onClick={() => navigate(`/pre-purchase/${relatedVerse.id}`)}
                      className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all duration-200"
                    >
                      <span className="text-primary font-medium hover:underline">
                        {displayData(relatedVerse.titulo_original, 'Título não disponível')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Aviso de Conteúdo Protegido */}
            <Card className="overflow-hidden rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
              <div className="p-6 text-center">
                <Lock className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Conteúdo Protegido</h3>
                <p className="text-amber-800 mb-4">
                  Para acessar o conteúdo completo desta versão, incluindo a letra formatada e o arquivo PDF para download, você precisa adquirir este item.
                </p>
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="w-full bg-primary hover:bg-primary/90 rounded-full transition-all duration-200 py-3 text-lg font-semibold"
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Comprar por R$ 15,00
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Botões de Ação Secundários */}
            <div className="flex gap-3 justify-center">

              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-gray-300 hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Informações da Versão */}
          <div className="space-y-6">
            {/* Cabeçalho */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {displayData(verse.titulo_original || verse.titulo_pt_br, 'Título')}
              </h1>
              <p className="text-xl text-gray-600 mb-4">{displayData(verse.musical, 'Musical')}</p>
            </div>

            {/* Título Traduzido */}
            {isValidData(verse.titulo_pt_br) && (
              <Card className="p-6 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Type className="w-5 h-5 mr-2 text-blue-600" />
                  Título em Português
                </h2>
                <p className="text-2xl font-bold text-blue-900">{displayData(verse.titulo_pt_br)}</p>
                <p className="text-sm text-gray-600 mt-2">Tradução brasileira do título original</p>
              </Card>
            )}

            {/* Informações do Musical */}
            <Card className="p-6 border-0 bg-gradient-to-r from-primary/5 to-purple-50 rounded-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Music className="w-5 h-5 mr-2 text-primary" />
                Informações da Versão
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Origem:</span>
                  <p className="text-gray-900 font-medium">{verse.origem ?? ''}</p>
                </div>
                {isValidData(verse.compositor) && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Música de:</span>
                    <p className="text-gray-900 font-medium">{displayData(verse.compositor)}</p>
                  </div>
                )}
                {isValidData(verse.letrista) && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Letra Original de:</span>
                    <p className="text-gray-900">{displayData(verse.letrista)}</p>
                  </div>
                )}
                {isValidData(verse.versionista) && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Versão brasileira de:</span>
                    <p className="text-gray-900">{displayData(verse.versionista)}</p>
                  </div>
                )}
                {isValidData(verse.revisao) && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Texto revisado por:</span>
                    <p className="text-gray-900">{displayData(verse.revisao)}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-600">Versionado em:</span>
                  <p className="text-gray-900">{verse.versionado_em ? (() => {
                    const [year, month, day] = verse.versionado_em.split('-');
                    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('pt-BR');
                  })() : 'Data não disponível'}</p>
                </div>
              </div>
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

            {/* Informações Adicionais */}
            {isValidData(verse.versao_brasileira) && (
              <Card className="p-6 border-0 bg-gray-50 rounded-xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Versão Brasileira</h2>
                <p className="text-gray-700 leading-relaxed">{displayData(verse.versao_brasileira)}</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrePurchase;