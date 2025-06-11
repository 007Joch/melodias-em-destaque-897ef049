
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Play, Pause, ShoppingCart, Eye, Users, Star, Calendar, Music, User } from 'lucide-react';
import { getVerseById } from '@/services/versesService';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

interface VerseData {
  id: number;
  titulo_pt_br: string;
  titulo_original: string;
  musical: string;
  estilo: string[];
  dificuldade: number;
  valor: number;
  url_imagem: string;
  status: string;
  criada_em: string;
  atualizada_em: string;
  ano_gravacao?: number;
  audio_instrumental?: string[];
  audio_original?: string;
  elenco?: string;
  conteudo?: string;
  visualizacoes?: number;
  compras?: number;
  compositor?: string[];
  letrista?: string[];
  versionista?: string[];
  revisao?: string[];
  letra_original?: string;
  pdf?: string;
  versionado_em?: string;
  criada_por?: string;
  origem?: string;
  natureza?: string[];
  musical_alt?: string[];
  titulo_alt?: string[];
  classificacao_vocal_alt?: string[];
  solistas_masculinos?: number;
  solistas_femininos?: number;
  coro_masculino?: boolean;
  coro_feminino?: boolean;
  versoes_irmas?: string[];
}

const PrePurchase = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadVerse = async () => {
      if (!id) {
        setError('ID do verso não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const verseData = await getVerseById(parseInt(id));
        
        if (!verseData) {
          setError('Verso não encontrado');
          return;
        }
        
        setVerse(verseData);
      } catch (error: any) {
        console.error('Erro ao carregar verso:', error);
        setError(error.message || 'Erro ao carregar verso');
      } finally {
        setLoading(false);
      }
    };

    loadVerse();
  }, [id]);

  const handlePlayAudio = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }

    if (playingAudio === audioUrl) {
      setPlayingAudio(null);
      return;
    }

    const audio = new Audio(audioUrl);
    audio.onended = () => {
      setPlayingAudio(null);
      setCurrentAudio(null);
    };
    
    audio.play();
    setPlayingAudio(audioUrl);
    setCurrentAudio(audio);
  };

  const handleAddToCart = () => {
    if (!verse) return;

    addToCart({
      id: verse.id.toString(),
      title: verse.titulo_pt_br,
      artist: verse.musical,
      category: Array.isArray(verse.estilo) ? verse.estilo.join(', ') : 'Musical',
      image: verse.url_imagem,
      price: verse.valor || 0
    });

    toast.success('Música adicionada ao carrinho!');
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-100 text-green-800';
    if (difficulty <= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDifficultyText = (difficulty: number) => {
    if (difficulty <= 2) return 'Fácil';
    if (difficulty <= 4) return 'Intermediário';
    return 'Difícil';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando música...</p>
        </div>
      </div>
    );
  }

  if (error || !verse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Música não encontrada</h2>
          <p className="text-gray-600 mb-6">{error || 'A música que você procura não existe.'}</p>
          <Button onClick={() => navigate('/')} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Imagem da música */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-square relative overflow-hidden rounded-lg">
                  <img
                    src={verse.url_imagem || '/placeholder.svg'}
                    alt={verse.titulo_pt_br}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Audio Preview */}
            {verse.audio_instrumental && verse.audio_instrumental.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Preview de Áudio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {verse.audio_instrumental.map((audio, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePlayAudio(audio)}
                        className="rounded-full"
                      >
                        {playingAudio === audio ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <span className="text-sm font-medium">
                        Instrumental {index + 1}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Informações da música */}
          <div className="space-y-6">
            {/* Informações principais */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">{verse.titulo_pt_br}</h1>
                    <p className="text-xl text-gray-600">{verse.titulo_original}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        {verse.musical}
                      </Badge>
                      {verse.estilo && verse.estilo.length > 0 && (
                        <Badge variant="outline" className="text-sm">
                          {Array.isArray(verse.estilo) ? verse.estilo.join(', ') : verse.estilo}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      R$ {(verse.valor || 0).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                
                {/* Dificuldade */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Dificuldade:</span>
                  <Badge className={getDifficultyColor(verse.dificuldade || 1)}>
                    {getDifficultyText(verse.dificuldade || 1)} ({verse.dificuldade || 1}/5)
                  </Badge>
                </div>

                {/* Ano de gravação */}
                {verse.ano_gravacao && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Ano de Gravação:
                    </span>
                    <span>{verse.ano_gravacao}</span>
                  </div>
                )}

                <Separator />

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">Visualizações</span>
                    </div>
                    <span className="text-xl font-bold">{verse.visualizacoes || 0}</span>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <ShoppingCart className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">Compras</span>
                    </div>
                    <span className="text-xl font-bold">{verse.compras || 0}</span>
                  </div>
                </div>

                <Separator />

                {/* Botão de adicionar ao carrinho */}
                <Button
                  onClick={handleAddToCart}
                  className="w-full rounded-full py-3 text-lg"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Adicionar ao Carrinho
                </Button>
              </CardContent>
            </Card>

            {/* Informações adicionais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Elenco */}
                {verse.elenco && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4" />
                        Elenco:
                      </h4>
                      <p className="text-gray-600">{verse.elenco}</p>
                    </div>
                  </>
                )}

                {/* Conteúdo */}
                {verse.conteudo && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Conteúdo:</h4>
                      <p className="text-gray-600">{verse.conteudo}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Créditos */}
                <div className="space-y-2">
                  <h4 className="font-medium">Créditos:</h4>
                  {verse.compositor && verse.compositor.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Compositor(es): </span>
                      <span className="text-gray-600">{verse.compositor.join(', ')}</span>
                    </div>
                  )}
                  {verse.letrista && verse.letrista.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Letrista(s): </span>
                      <span className="text-gray-600">{verse.letrista.join(', ')}</span>
                    </div>
                  )}
                  {verse.versionista && verse.versionista.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Versionista(s): </span>
                      <span className="text-gray-600">{verse.versionista.join(', ')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrePurchase;
