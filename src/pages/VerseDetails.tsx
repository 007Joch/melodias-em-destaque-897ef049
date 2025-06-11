import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Music, Download, Video, Loader2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { getVerse, incrementViews, getVersesByIds } from '../services/versesService';
import { hasAccessToVerse } from '../services/purchaseService';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '../integrations/supabase/types';

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
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedVerses, setRelatedVerses] = useState<Verse[]>([]);

  useEffect(() => {
    const fetchVerse = async () => {
      // Extrair identificador da URL atual
      const currentPath = window.location.pathname;
      const pathSegments = currentPath.split('/').filter(segment => segment);
      
      // O identificador pode estar em diferentes posições dependendo da estrutura da URL
      let identifier = id || slug;
      
      // Se não temos identificador dos params, pegar da URL
      if (!identifier && pathSegments.length > 0) {
        // Pegar o último segmento que não seja vazio
        identifier = pathSegments[pathSegments.length - 1];
      }
      
      // Verificar se o identificador é uma rota específica que não deve ser tratada como verso
      const reservedRoutes = ['manage-verses', 'manage-users', 'create', 'login', 'music', 'pre-purchase', 'meus-pedidos'];
      if (identifier && reservedRoutes.includes(identifier)) {
        console.log('🚫 Rota reservada detectada, não é um verso:', identifier);
        setIsLoading(false);
        setError(null);
        setVerse(null);
        return;
      }
      
      console.log('🔍 Informações da URL:', {
        currentPath,
        pathSegments,
        id,
        slug,
        finalIdentifier: identifier
      });
      
      if (!identifier) {
        console.error('❌ Nenhum identificador encontrado na URL');
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
          
          // Verificar se o usuário tem acesso ao verso
          const hasAccess = await hasAccessToVerse(user?.id || null, data.id, profile?.role);
          
          if (!hasAccess) {
            console.log('🚫 Usuário não tem acesso ao verso, redirecionando para pré-compra');
            navigate(`/pre-purchase/${data.id}`, { replace: true });
            return;
          }
          
          setVerse(data);
          
          // Incrementar visualizações
          try {
            await incrementViews(data.id);
            console.log('✅ Visualizações incrementadas para verso:', data.id);
          } catch (viewError) {
            console.warn('⚠️ Erro ao incrementar visualizações:', viewError);
          }
          
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
          console.error('❌ Verso não encontrado para identificador:', identifier);
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
  }, [id, slug]); // Dependências do useEffect

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
    // Se não há verso e não há erro, é uma rota reservada - não renderizar nada
    if (!error) {
      return null;
    }
    
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

  const handleDownloadPDF = () => {
    if (verse.pdf) {
      window.open(verse.pdf, '_blank');
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

              {/* Seção Veja Também */}
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
                          {displayData(relatedVerse.titulo_pt_br || relatedVerse.titulo_original, 'Título não disponível')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="space-y-4">
                {/* Botão de download PDF */}
                <Button
                  onClick={handleDownloadPDF}
                  disabled={!verse.pdf}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-all duration-200 py-3 text-lg font-semibold"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {verse.pdf ? 'Baixar PDF' : 'PDF Indisponível'}
                </Button>
                

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


        </main>

      </div>
  );
};

export default VerseDetails;
