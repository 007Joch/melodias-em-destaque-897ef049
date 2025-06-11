import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Play, Download, ShoppingCart, Heart, Star, Clock, Users, Music } from 'lucide-react';
import { toast } from 'sonner';

interface Verse {
  id: number;
  titulo_original: string;
  titulo_pt_br: string;
  musical: string;
  letra_original: string;
  valor: number;
  url_imagem?: string;
  audio_original?: string;
  dificuldade?: number;
  solistas_masculinos?: number;
  solistas_femininos?: number;
  coro_masculino?: boolean;
  coro_feminino?: boolean;
  estilo?: string[];
  natureza?: string[];
  compositor?: string[];
  letrista?: string[];
  versionista?: string[];
}

const PrePurchase = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadVerse();
  }, [slug]);

  const loadVerse = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('versoes')
        .select('*');
      
      // Verificar se é um ID numérico ou slug
      if (slug && !isNaN(Number(slug))) {
        query = query.eq('id', parseInt(slug));
      } else {
        query = query.eq('titulo_pt_br', slug);
      }
      
      const { data, error } = await query.single();

      if (error) {
        console.error('Erro ao carregar verso:', error);
        toast.error('Verso não encontrado');
        navigate('/');
        return;
      }

      setVerse(data);
    } catch (error) {
      console.error('Erro ao carregar verso:', error);
      toast.error('Erro ao carregar verso');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Faça login para adicionar ao carrinho');
      navigate('/login');
      return;
    }

    if (!verse) return;

    addToCart({
      id: verse.id.toString(),
      title: verse.titulo_pt_br,
      artist: verse.musical,
      category: verse.estilo?.[0] || 'Musical',
      image: verse.url_imagem,
      price: verse.valor || 0
    });

    toast.success('Adicionado ao carrinho!');
  };

  const getDifficultyBadge = (difficulty: number) => {
    const colors = ['bg-green-100 text-green-800', 'bg-yellow-100 text-yellow-800', 'bg-red-100 text-red-800'];
    const labels = ['Fácil', 'Médio', 'Difícil'];
    return (
      <Badge className={colors[difficulty - 1] || colors[0]}>
        {labels[difficulty - 1] || 'Não informado'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!verse) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Música não encontrada</h2>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Imagem e Controles de Áudio */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={verse.url_imagem || '/musical-generic.svg'}
                  alt={verse.titulo_pt_br}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Controles de Áudio */}
              <div className="space-y-3">
                {verse.audio_original && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handlePlayAudio(verse.audio_original)}
                  >
                    {audioPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    Áudio Original
                  </Button>
                )}
                
                {verse.audio_instrumental && verse.audio_instrumental.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Instrumentais:</h4>
                    {verse.audio_instrumental.map((audio: string, index: number) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handlePlayAudio(audio)}
                      >
                        <Music className="w-4 h-4 mr-2" />
                        Instrumental {index + 1}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações da Música */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
                    {verse.titulo_pt_br}
                  </CardTitle>
                  <p className="text-lg text-gray-600 mt-1">{verse.titulo_original}</p>
                  <p className="text-xl font-semibold text-primary mt-2">{verse.musical}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">
                    R$ {(verse.valor || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Badges de Informação */}
              <div className="flex flex-wrap gap-2">
                {verse.dificuldade && getDifficultyBadge(verse.dificuldade)}
                {verse.estilo && verse.estilo.map((style: string, index: number) => (
                  <Badge key={index} variant="outline">{style}</Badge>
                ))}
                {verse.natureza && verse.natureza.map((nature: string, index: number) => (
                  <Badge key={index} variant="secondary">{nature}</Badge>
                ))}
              </div>

              <Separator />

              {/* Informações de Produção */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {verse.compositor && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Compositor(es):</h4>
                    <p className="text-gray-600">{verse.compositor.join(', ')}</p>
                  </div>
                )}
                
                {verse.letrista && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Letrista(s):</h4>
                    <p className="text-gray-600">{verse.letrista.join(', ')}</p>
                  </div>
                )}
                
                {verse.versionista && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Versionista(s):</h4>
                    <p className="text-gray-600">{verse.versionista.join(', ')}</p>
                  </div>
                )}
                
                {verse.ano_gravacao && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Ano de Gravação:</h4>
                    <p className="text-gray-600">{verse.ano_gravacao}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Informações Vocais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {verse.solistas_masculinos > 0 && (
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Users className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                    <p className="font-semibold text-blue-900">{verse.solistas_masculinos}</p>
                    <p className="text-blue-700">Solistas ♂</p>
                  </div>
                )}
                
                {verse.solistas_femininos > 0 && (
                  <div className="text-center p-3 bg-pink-50 rounded-lg">
                    <Users className="w-6 h-6 mx-auto mb-1 text-pink-600" />
                    <p className="font-semibold text-pink-900">{verse.solistas_femininos}</p>
                    <p className="text-pink-700">Solistas ♀</p>
                  </div>
                )}
                
                {verse.coro_masculino && (
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Users className="w-6 h-6 mx-auto mb-1 text-green-600" />
                    <p className="font-semibold text-green-900">Sim</p>
                    <p className="text-green-700">Coro ♂</p>
                  </div>
                )}
                
                {verse.coro_feminino && (
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Users className="w-6 h-6 mx-auto mb-1 text-purple-600" />
                    <p className="font-semibold text-purple-900">Sim</p>
                    <p className="text-purple-700">Coro ♀</p>
                  </div>
                )}
              </div>

              {verse.elenco && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Elenco Original:</h4>
                    <p className="text-gray-600 text-sm">{verse.elenco}</p>
                  </div>
                </>
              )}

              {verse.conteudo && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Descrição:</h4>
                    <div 
                      className="text-gray-600 text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: verse.conteudo }}
                    />
                  </div>
                </>
              )}

              <Separator />

              {/* Estatísticas */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {verse.visualizacoes || 0} visualizações
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {verse.compras || 0} compras
                  </span>
                </div>
              </div>

              {/* Botão de Compra */}
              <div className="pt-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Adicionar ao Carrinho
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrePurchase;
