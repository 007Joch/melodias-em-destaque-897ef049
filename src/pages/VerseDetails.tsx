import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Music, Download, Video, Loader2, Type, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuthHook";

import { getVerse, getVersesByIds, Verse } from '../services/versesService';

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

// Função específica para validar URLs de PDF
const isValidPdfUrl = (url: any): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'null' || trimmed === 'undefined') return false;
  
  // Aceitar URLs do Google Drive, links diretos de PDF ou outros domínios válidos
  const urlPattern = /^https?:\/\/.+/i;
  return urlPattern.test(trimmed);
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

const VerseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedVerses, setRelatedVerses] = useState<Verse[]>([]);

  useEffect(() => {
    const fetchVerse = async () => {
      // Extrair identificador da URL atual
      const currentPath = window.location.pathname;
      const pathSegments = currentPath.split('/').filter(segment => segment);
      
      console.log('🔍 Informações da URL:', {
        currentPath,
        pathSegments,
        id
      });
      
      if (!id) {
        console.error('❌ Nenhum identificador encontrado na URL');
        setError('Identificador do verso não fornecido');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔍 Buscando verso com identificador:', id);
        const data = await getVerse(id);
        
        if (data) {
          console.log('✅ Verso encontrado:', { id: data.id, titulo: data.titulo_pt_br || data.titulo_original });
          setVerse(data);
          

          
          // Buscar versões irmãs se existirem
          if (data.versoes_irmas && data.versoes_irmas.length > 0) {
            try {
              const relatedData = await getVersesByIds(data.versoes_irmas);
              setRelatedVerses(relatedData);
            } catch (err) {
              console.error('Erro ao carregar versões irmãs:', err);
            }
          }
        } else {
          console.error('❌ Verso não encontrado para identificador:', id);
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
  }, [id]); // Dependências do useEffect

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

  const handleDownloadPDF = () => {
    if (verse?.pdf) {
      window.open(verse.pdf, '_blank');
    }
  };

  // Função para limpar apenas espaçamentos automáticos, preservando espaçamentos intencionais do usuário
  const cleanDisplayContent = (htmlContent: string): string => {
    if (!htmlContent) return '';
    
    let cleaned = htmlContent;
    
    // Remove apenas espaços antes e depois de tags HTML (espaçamentos automáticos)
    cleaned = cleaned.replace(/\s+</g, '<');
    cleaned = cleaned.replace(/>\s+/g, '>');
    
    // Remove espaços extras entre parágrafos (espaçamentos automáticos)
    cleaned = cleaned.replace(/<\/p>\s+<p>/g, '</p><p>');
    
    // Remove espaços no início e fim de parágrafos (espaçamentos automáticos)
    cleaned = cleaned.replace(/<p>\s+/g, '<p>');
    cleaned = cleaned.replace(/\s+<\/p>/g, '</p>');
    
    // Remove espaços no início e fim do conteúdo total
    cleaned = cleaned.trim();
    
    // Para evitar espaçamento automático do CSS prose entre parágrafos consecutivos,
    // adiciona estilo inline para remover margin entre parágrafos
    cleaned = cleaned.replace(/<p>/g, '<p style="margin: 0; padding: 0;">');
    
    // NÃO remove espaços duplos dentro do conteúdo - preserva formatação intencional do usuário
    
    return cleaned;
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    if (verse) {
      navigate(`/edit-verse/${verse.id}`);
    }
  };

  // Verificar se o usuário é admin
  const isAdmin = profile?.role === 'admin';

  // Função para extrair ID do YouTube
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
            onClick={handleGoBack}
            className="mb-6 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
            {/* Sidebar Desktop - Esquerda */}
            <div className="hidden lg:block lg:col-span-3 space-y-6">
              {/* Áudio Original - Miniplayer do YouTube - Desktop */}
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

              {/* Seção Veja Também - Versões irmãs - Desktop */}
              {relatedVerses.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Veja Também</h3>
                  <div className="space-y-2">
                    {relatedVerses.map((relatedVerse) => (
                      <button
                        key={relatedVerse.id}
                        onClick={() => navigate(`/verse/${relatedVerse.id}`)}
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

              {/* Botão de download PDF - Desktop */}
              <Button
                onClick={handleDownloadPDF}
                disabled={!verse.pdf}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-all duration-200 py-3 text-lg font-semibold"
              >
                <Download className="w-5 h-5 mr-2" />
                {verse.pdf ? 'Baixar PDF' : 'PDF Indisponível'}
              </Button>


            </div>

            {/* Conteúdo principal - Mobile e Desktop */}
            <div className="space-y-6 lg:col-span-4">
              {/* Cabeçalho */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {displayData(verse.titulo_original, 'Título não disponível')}
                  </h1>
                  {isAdmin && (
                    <Button
                      onClick={handleEdit}
                      variant="outline"
                      size="sm"
                      className="ml-4 hover:bg-primary hover:text-white transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
                <p className="text-xl text-gray-600 mb-4">{verse.musical || 'Musical'}</p>
              </div>

              {/* Informações do Musical */}
              <Card className="p-6 border-0 bg-gradient-to-r from-primary/5 to-purple-50 rounded-xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Music className="w-5 h-5 mr-2 text-primary" />
                  Informações da Versão
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isValidData(verse.titulo_pt_br) && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Título em Português:</span>
                      <p className="text-gray-900 font-medium">{displayData(verse.titulo_pt_br)}</p>
                    </div>
                  )}
                  {isValidData(verse.origem) && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Origem:</span>
                      <p className="text-gray-900 font-medium">{verse.origem}</p>
                    </div>
                  )}
                  {isValidData(verse.compositor) && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Música de:</span>
                      <p className="text-gray-900 font-medium">{displayData(verse.compositor)}</p>
                    </div>
                  )}
                  {isValidData(verse.letrista) && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Letra original de:</span>
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
                
                {/* Versão baseada na gravação de - Aviso centralizado */}
                {(isValidData(verse.ano_gravacao) || isValidData(verse.elenco)) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-center text-sm text-gray-600 italic">
                      Versão baseada na gravação de {[verse.ano_gravacao, verse.elenco].filter(Boolean).join(' ')}
                    </p>
                  </div>
                )}
              </Card>

              {/* Áudio Original - Miniplayer do YouTube - Mobile apenas */}
              <div className="lg:hidden">
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
              </div>

              {/* Seção Veja Também - Versões irmãs - Mobile apenas */}
              {relatedVerses.length > 0 && (
                <div className="mb-6 lg:hidden">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Veja Também</h3>
                  <div className="space-y-2">
                    {relatedVerses.map((relatedVerse) => (
                      <button
                        key={relatedVerse.id}
                        onClick={() => navigate(`/verse/${relatedVerse.id}`)}
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

              {/* Botão de download PDF - Mobile apenas */}
              <div className="lg:hidden">
                <Button
                  onClick={handleDownloadPDF}
                  disabled={!verse.pdf}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-all duration-200 py-3 text-lg font-semibold"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {verse.pdf ? 'Baixar PDF' : 'PDF Indisponível'}
                </Button>
              </div>




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
                  <div 
                    className="prose prose-gray max-w-none"
                    dangerouslySetInnerHTML={{ __html: cleanDisplayContent(verse.conteudo!) }}
                    style={{
                      fontSize: '16px',
                      lineHeight: '1.6',
                      color: '#374151'
                    }}
                  />
                </Card>
              )}

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


          </div>
        </main>
        <Footer />
    </div>
  );
};

export default VerseDetails;
