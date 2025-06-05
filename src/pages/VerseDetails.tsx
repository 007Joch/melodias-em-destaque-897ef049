import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Music, Plus, Share2, Heart, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { CartProvider } from "@/hooks/useCart";
import { getVerseById, incrementViews } from '../services/versesService';
import { Database } from '../integrations/supabase/types';

type Verse = Database['public']['Tables']['verses']['Row'];

const VerseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerse = async () => {
      if (!id) {
        setError('ID do verso não fornecido');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const verseId = parseInt(id);
        
        if (isNaN(verseId)) {
          setError('ID do verso inválido');
          setIsLoading(false);
          return;
        }

        const data = await getVerseById(verseId);
        
        if (data) {
          setVerse(data);
          // Incrementar visualizações
          await incrementViews(verseId);
          setError(null);
        } else {
          setError('Verso não encontrado');
        }
      } catch (err) {
        console.error('Erro ao carregar verso:', err);
        setError('Erro ao carregar o verso. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerse();
  }, [id]);

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

  if (error || !verse) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Verso não encontrado'}</p>
          <Button onClick={() => navigate('/')} className="mr-2">
            Voltar ao Início
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      id: verse.id.toString(),
      title: verse.title,
      artist: verse.artist,
      category: verse.category,
      image: verse.image_url || '/placeholder.svg'
    });
  };

  const handleGoBack = () => {
    navigate(-1);
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
            {/* Vídeo do YouTube */}
            <div className="space-y-4">
              {verse.youtube_url && (
                <Card className="overflow-hidden rounded-xl border-0 shadow-lg">
                  <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Video className="w-5 h-5 mr-2 text-red-600" />
                      Vídeo Musical
                    </h2>
                    <div className="aspect-video w-full rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/${verse.youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1] || ''}`}
                        className="w-full h-full"
                        allowFullScreen
                        title={`Vídeo: ${verse.title}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      Assista ao vídeo oficial desta música diretamente do YouTube.
                    </p>
                  </div>
                </Card>
              )}

              {/* Ações */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-full transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar ao Carrinho
                </Button>
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

            {/* Informações do Verso */}
            <div className="space-y-6">
              {/* Cabeçalho */}
              <div>
                <span className="inline-block px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full mb-3">
                  {verse.category}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{verse.title}</h1>
                <p className="text-xl text-gray-600 mb-4">{verse.artist}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{(verse.views || 0).toLocaleString()} visualizações</span>
                  <span>•</span>
                  <span>{new Date(verse.data).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Informações do Musical */}
              <Card className="p-6 border-0 bg-gradient-to-r from-primary/5 to-purple-50 rounded-xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Music className="w-5 h-5 mr-2 text-primary" />
                  Informações do Musical
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Do Musical:</span>
                    <p className="text-gray-900 font-medium">{verse.musical}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Música:</span>
                    <p className="text-gray-900 font-medium">{verse.musica}</p>
                  </div>
                  {verse.letra_original && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Letra Original:</span>
                      <p className="text-gray-900">{verse.letra_original}</p>
                    </div>
                  )}
                  {verse.letra_original_de && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Letra Original de:</span>
                      <p className="text-gray-900">{verse.letra_original_de}</p>
                    </div>
                  )}
                  {verse.versao_brasileira_de && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Versão Brasileira de:</span>
                      <p className="text-gray-900">{verse.versao_brasileira_de}</p>
                    </div>
                  )}
                  {verse.texto_revisado_por && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Texto Revisado por:</span>
                      <p className="text-gray-900">{verse.texto_revisado_por}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-600">Data:</span>
                    <p className="text-gray-900">{new Date(verse.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </Card>

              {/* Descrição */}
              {verse.descricao && (
                <Card className="p-6 border-0 bg-gray-50 rounded-xl">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Sobre este verso</h2>
                  <p className="text-gray-700 leading-relaxed">{verse.descricao}</p>
                </Card>
              )}

              {/* Conteúdo Formatado */}
              <Card className="p-6 border-0 bg-gradient-to-br from-primary/5 to-purple-50 rounded-xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Conteúdo</h2>
                {verse.conteudo && (
                  <div 
                    className="prose prose-gray max-w-none"
                    dangerouslySetInnerHTML={{ __html: verse.conteudo }}
                    style={{
                      fontSize: '16px',
                      lineHeight: '1.6',
                      color: '#374151'
                    }}
                  />
                )}
              </Card>
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