import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Star, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Verse } from '../services/versesService';
import { DEFAULT_VERSE_IMAGE } from '@/constants/images';

interface SearchResultsProps {
  searchTerm: string;
  exactMatch: Verse | null;
  similarResults: Verse[];
  onClose: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  searchTerm,
  exactMatch,
  similarResults,
  onClose
}) => {
  const navigate = useNavigate();

  const isValidData = (data: any) => {
    return data && data !== '' && data !== null && data !== undefined;
  };

  const displayData = (data: any, fallback: string = 'Dados inconsistentes') => {
    return isValidData(data) ? data : fallback;
  };

  // Função para obter o título mais relevante baseado na busca
  const getRelevantTitle = (verse: Verse) => {
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    // Verificar se o termo pesquisado corresponde ao título original
    if (verse.titulo_original && verse.titulo_original.toLowerCase() === searchTermLower) {
      return verse.titulo_original;
    }
    
    // Verificar se corresponde a algum título alternativo
    if (Array.isArray(verse.titulo_alt)) {
      const matchingAlt = verse.titulo_alt.find(alt => 
        alt && alt.toLowerCase().trim() === searchTermLower
      );
      if (matchingAlt) {
        return matchingAlt;
      }
      
      // Se não há correspondência exata, verificar se contém o termo
      const containingAlt = verse.titulo_alt.find(alt => 
        alt && alt.toLowerCase().includes(searchTermLower)
      );
      if (containingAlt) {
        return containingAlt;
      }
    }
    
    // Fallback para título original
    return verse.titulo_original || verse.titulo_pt_br;
  };

  // Função para verificar se deve mostrar título original como secundário
  const shouldShowOriginalAsSecondary = (verse: Verse, relevantTitle: string) => {
    return relevantTitle !== verse.titulo_original && verse.titulo_original;
  };

  // Função para obter imagem válida (baseada no MusicCard)
  const getValidImage = (image: string | null) => {
    if (!image || image.trim() === '' || image === 'null') {
      return DEFAULT_VERSE_IMAGE;
    }
    
    if (image.includes('/capas/') || image.includes('supabase.co') || image.includes('hlrcvvaneofcpncbqjyg')) {
      return image;
    }
    
    if (image.startsWith('http')) {
      return image;
    }
    
    return DEFAULT_VERSE_IMAGE;
  };

  const handleVerseClick = (verseId: number, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    console.log('Clicando no verso:', verseId);
    onClose();
    navigate(`/preview/${verseId}`);
  };

  const handleShowMoreResults = () => {
    onClose();
    navigate(`/busca?q=${encodeURIComponent(searchTerm)}`);
  };

  if (!searchTerm.trim()) {
    return null;
  }

  const hasResults = exactMatch || similarResults.length > 0;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Resultados para "{searchTerm}"
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {!hasResults ? (
          <div className="text-center py-8 text-gray-500">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum resultado encontrado</p>
            <p className="text-sm">Tente usar termos diferentes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resultado Exato */}
            {exactMatch && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  Resultado Exato
                </h4>
                <Card 
                  onClick={(e) => handleVerseClick(exactMatch.id, e)}
                  className="group overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white cursor-pointer"
                >
                  <div className="flex p-4">
                    {/* Coluna da imagem */}
                    <div className="flex flex-col items-center mr-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                        <img
                          src={getValidImage(exactMatch.url_imagem)}
                          alt={displayData(exactMatch.titulo_original, 'Título não disponível')}
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
                      {(() => {
                        const relevantTitle = getRelevantTitle(exactMatch);
                        const showOriginalAsSecondary = shouldShowOriginalAsSecondary(exactMatch, relevantTitle);
                        
                        return (
                          <>
                            {/* Título mais relevante (principal) */}
                            <h3 className="font-bold text-gray-900 text-base sm:text-lg hover:text-primary transition-colors mb-1">
                              {displayData(relevantTitle, 'Título não disponível')}
                            </h3>
                            {/* Título original como secundário (se diferente do relevante) */}
                            {showOriginalAsSecondary && (
                              <p className="text-sm text-gray-600 mb-1 line-clamp-1">
                                <span className="text-xs text-gray-500">Título original:</span> {exactMatch.titulo_original}
                              </p>
                            )}
                            {/* Musical */}
                            <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                              {displayData(exactMatch.musical, 'Musical não informado')}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Resultados Similares */}
            {similarResults.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Resultados Similares ({similarResults.length})
                </h4>
                <div className="space-y-2">
                  {similarResults.map((verse) => (
                    <Card 
                      key={verse.id} 
                      onClick={(e) => handleVerseClick(verse.id, e)}
                      className="group overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white cursor-pointer"
                    >
                      <div className="flex p-3">
                        {/* Coluna da imagem */}
                        <div className="flex flex-col items-center mr-3">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                            <img
                              src={getValidImage(verse.url_imagem)}
                              alt={displayData(verse.titulo_original, 'Título não disponível')}
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
                          {(() => {
                            const relevantTitle = getRelevantTitle(verse);
                            const showOriginalAsSecondary = shouldShowOriginalAsSecondary(verse, relevantTitle);
                            
                            return (
                              <>
                                {/* Título mais relevante (principal) */}
                                <h4 className="font-bold text-gray-900 text-sm hover:text-primary transition-colors mb-1">
                                  {displayData(relevantTitle, 'Título não disponível')}
                                </h4>
                                {/* Título original como secundário (se diferente do relevante) */}
                                {showOriginalAsSecondary && (
                                  <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                                    <span className="text-xs text-gray-500">Título original:</span> {verse.titulo_original}
                                  </p>
                                )}
                                {/* Musical */}
                                <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                                  {displayData(verse.musical, 'Musical não informado')}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Botão para exibir mais resultados */}
            {hasResults && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button 
                  onClick={handleShowMoreResults}
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 text-primary hover:text-primary-dark"
                >
                  <span>Exibir mais resultados encontrados</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;