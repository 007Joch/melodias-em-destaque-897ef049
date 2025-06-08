import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Eye, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Verse } from '../services/versesService';

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
  const formatPrice = (price: number | null) => {
    if (!price || price === 0) return 'Gratuito';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const isValidData = (data: any) => {
    return data && data !== '' && data !== null && data !== undefined;
  };

  const displayData = (data: any, fallback: string = 'Dados inconsistentes') => {
    return isValidData(data) ? data : fallback;
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
                <Link 
                  to={`/verse/${exactMatch.id}`} 
                  onClick={onClose}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        {isValidData(exactMatch.url_imagem) && (
                          <img
                            src={exactMatch.url_imagem}
                            alt={displayData(exactMatch.titulo_pt_br)}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-gray-900 truncate">
                            {displayData(exactMatch.titulo_pt_br)}
                          </h5>
                          <p className="text-sm text-gray-600 truncate">
                            {displayData(exactMatch.musical)} • {displayData(exactMatch.compositor)}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {displayData(exactMatch.estilo)}
                            </Badge>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Eye className="w-3 h-3 mr-1" />
                                {exactMatch.visualizacoes || 0}
                              </span>
                              <span className="font-medium text-primary">
                                {formatPrice(exactMatch.valor ? exactMatch.valor / 100 : 0)} {/* Converter de centavos para reais */}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
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
                    <Link 
                      key={verse.id} 
                      to={`/verse/${verse.id}`} 
                      onClick={onClose}
                      className="block"
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-3">
                          <div className="flex items-start space-x-3">
                            {isValidData(verse.url_imagem) && (
                          <img
                            src={verse.url_imagem}
                                alt={displayData(verse.titulo_pt_br)}
                                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h6 className="font-medium text-gray-900 truncate text-sm">
                                {displayData(verse.titulo_pt_br)}
                              </h6>
                              <p className="text-xs text-gray-600 truncate">
                                {displayData(verse.musical)} • {displayData(verse.compositor)}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  {displayData(verse.estilo)}
                                </Badge>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <Eye className="w-3 h-3 mr-1" />
                                    {verse.visualizacoes || 0}
                                  </span>
                                  <span className="font-medium text-primary">
                                    {formatPrice(verse.valor ? verse.valor / 100 : 0)} {/* Converter de centavos para reais */}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;