import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Music, Plus, Share2, Heart, Video, Loader2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { CartProvider } from "@/hooks/useCart";
import { useAppCache } from "@/hooks/useAppCache";
import { getVerse, incrementViews } from '../services/versesService';
import { Database } from '../integrations/supabase/types';

type Verse = Database['public']['Tables']['versoes']['Row'];

const VerseDetails = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { clearCache, invalidateQueries } = useAppCache();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerse = async () => {
      const identifier = id || slug;
      
      if (!identifier) {
        setError('Identificador do verso não fornecido');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔍 Buscando verso com identificador:', identifier);
        const data = await getVerse(identifier);
        
        if (data) {
          console.log('✅ Verso encontrado:', { id: data.id, titulo: data.titulo_pt_br || data.titulo_original });
          setVerse(data);
          
          // Incrementar visualizações
          try {
            await incrementViews(data.id);
          } catch (viewError) {
            console.warn('⚠️ Erro ao incrementar visualizações:', viewError);
          }
          
          // Invalida cache para manter dados atualizados
          invalidateQueries(['verses', 'homepage-verses', 'musicgrid-verses']);
        } else {
          console.error('❌ Verso não encontrado');
          setError('Verso não encontrado');
        }
      } catch (err) {
        console.error('❌ Erro ao carregar verso:', err);
        setError('Erro ao carregar dados do verso');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerse();
  }, [id, slug, invalidateQueries]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Carregando verso...</p>
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
          <p className="text-gray-600 mb-4">Verso não encontrado</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Função auxiliar simplificada para verificar se um valor é válido
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

  // Função simplificada para exibir dados
  const displayData = (value: any, fallback: string = 'Não informado'): string => {
    if (!isValidData(value)) return fallback;
    
    if (Array.isArray(value)) {
      const validItems = value.filter(item => isValidData(item));
      return validItems.length > 0 ? validItems.join(', ') : fallback;
    }
    
    return String(value);
  };

  const handleAddToCart = () => {
    addToCart({
      id: verse.id.toString(),
      title: displayData(verse.titulo_original || verse.titulo_pt_br, 'Título'),
      artist: displayData(verse.musical, 'Musical'),
      category: displayData(verse.estilo?.[0], 'Categoria'),
      image: verse.url_imagem || '/placeholder.svg',
      price: verse.valor ? verse.valor / 100 : 0 // Converter de centavos para reais
    });
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

  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Header />
        
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
                  <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Video className="w-5 h-5 mr-2 text-red-600" />
                      Áudio Original
                    </h2>
                    <div className="aspect-video w-full rounded-lg overflow-hidden">
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
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Video className="w-5 h-5 mr-2 text-gray-600" />
                      Áudio Original
                    </h2>
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                      <p className="text-gray-600 text-center">Áudio não disponível</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Ações */}
              <div className="space-y-4">
                {/* Preço e Botão de Adicionar */}
                <div className="space-y-4">
                  {/* Preço em destaque */}
                  {isValidData(verse.valor) && verse.valor! > 0 ? (
                    <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-purple-100 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Preço</p>
                      <p className="text-3xl font-bold text-primary">
                        R$ {(verse.valor! / 100).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-gradient-to-r from-green-100 to-emerald-200 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Preço</p>
                      <p className="text-lg font-semibold text-green-700">
                        Gratuito
                      </p>
                    </div>
                  )}
                  
                  {/* Botão de adicionar ao carrinho */}
                  <Button
                    onClick={handleAddToCart}
                    className="w-full bg-primary hover:bg-primary/90 rounded-full transition-all duration-200 py-3 text-lg font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar ao Carrinho
                    {isValidData(verse.valor) && verse.valor! > 0 && (
                      <span className="ml-2 text-primary-foreground/80">
                        • R$ {(verse.valor! / 100).toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </Button>
                </div>
                
                {/* Botões de Ação Secundários */}
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full border-gray-300 hover:bg-gray-50"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full border-gray-300 hover:bg-gray-50"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Informações do Verso */}
            <div className="space-y-6">
              {/* Cabeçalho */}
              <div>
                <span className="inline-block px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full mb-3">
                  {displayData(verse.estilo?.[0], 'Estilo não definido')}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {displayData(verse.titulo_original || verse.titulo_pt_br, 'Título')}
                </h1>
                <p className="text-xl text-gray-600 mb-4">{displayData(verse.musical, 'Musical')}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{(verse.visualizacoes || 0).toLocaleString()} visualizações</span>
                  <span>•</span>
                  <span>{verse.versionado_em ? new Date(verse.versionado_em).toLocaleDateString('pt-BR') : 'Data não disponível'}</span>
                </div>
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
                  Informações do Musical
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Origem:</span>
                    <p className="text-gray-900 font-medium">{displayData(verse.musical)}</p>
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
                    <p className="text-gray-900">{verse.versionado_em ? new Date(verse.versionado_em).toLocaleDateString('pt-BR') : 'Data não disponível'}</p>
                  </div>
                </div>
              </Card>

              {/* Informações Adicionais */}
              {isValidData(verse.versao_brasileira) && (
                <Card className="p-6 border-0 bg-gray-50 rounded-xl">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Versão Brasileira</h2>
                  <p className="text-gray-700 leading-relaxed">{displayData(verse.versao_brasileira)}</p>
                </Card>
              )}

              {/* Conteúdo Formatado */}
              {isValidData(verse.conteudo) && (
                <Card className="p-6 border-0 bg-gradient-to-br from-primary/5 to-purple-50 rounded-xl">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Conteúdo</h2>
                  <div 
                    className="prose prose-gray max-w-none"
                    dangerouslySetInnerHTML={{ __html: verse.conteudo! }}
                    style={{
                      fontSize: '16px',
                      lineHeight: '1.6',
                      color: '#374151'
                    }}
                  />
                </Card>
              )}
            </div>
          </div>

          {/* Versos Relacionados */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Versos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <Card key={item} className="group overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover-scale bg-white">
                  <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-100">
                      <Music className="w-8 h-8 text-primary/60" />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                  <div className="p-4">
                    <span className="inline-block px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full mb-2">
                      Gospel
                    </span>
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">Verso Relacionado {item}</h3>
                    <p className="text-sm text-gray-600 mb-3">Artista {item}</p>
                    <Button className="w-full bg-primary hover:bg-primary/90 rounded-full transition-all duration-200 text-sm py-2">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
};

export default VerseDetails;
