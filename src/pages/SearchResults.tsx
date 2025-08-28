import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Music, Star, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Verse, searchVerses } from '../services/versesService';
import { DEFAULT_VERSE_IMAGE } from '@/constants/images';
import { supabase } from '@/integrations/supabase/client';

interface ExtendedSearchResults {
  exact: Verse | null;
  similar: Verse[];
  keywordMatches: Verse[];
  musicalMatches: Verse[];
}

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchTerm = searchParams.get('q') || '';
  const [results, setResults] = useState<ExtendedSearchResults>({
    exact: null,
    similar: [],
    keywordMatches: [],
    musicalMatches: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isValidData = (data: any) => {
    return data && data !== '' && data !== null && data !== undefined;
  };

  const displayData = (data: any, fallback: string = 'Dados inconsistentes') => {
    return isValidData(data) ? data : fallback;
  };

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

  const shouldShowOriginalAsSecondary = (verse: Verse, relevantTitle: string) => {
    return relevantTitle !== verse.titulo_original && verse.titulo_original;
  };

  const handleVerseClick = (verseId: number) => {
    navigate(`/preview/${verseId}`);
  };

  const performExtendedSearch = async (term: string): Promise<ExtendedSearchResults> => {
    try {
      // Primeiro, obter os resultados básicos usando a função existente
      const basicResults = await searchVerses(term, 50);
      
      const searchTermLower = term.toLowerCase().trim();
      
      // Buscar correspondências por palavras-chave (busca parcial)
      const { data: keywordData, error: keywordError } = await supabase
        .from('versoes')
        .select('*')
        .eq('status', 'active')
        .or(`titulo_original.ilike.%${searchTermLower}%,titulo_pt_br.ilike.%${searchTermLower}%`)
        .order('titulo_original', { ascending: true });

      let keywordMatches: Verse[] = [];
      if (!keywordError && keywordData) {
        // Filtrar para remover duplicatas dos resultados básicos
        const existingIds = new Set([
          ...(basicResults.exact ? [basicResults.exact.id] : []),
          ...basicResults.similar.map(v => v.id)
        ]);
        
        keywordMatches = keywordData
          .filter(verse => !existingIds.has(verse.id))
          .filter(verse => {
            // Verificar se realmente contém o termo como palavra parcial
            const titleOriginal = (verse.titulo_original || '').toLowerCase();
            const titlePtBr = (verse.titulo_pt_br || '').toLowerCase();
            
            // Verificar titulo_alt também
            const titleAltMatch = Array.isArray(verse.titulo_alt) 
              ? verse.titulo_alt.some(alt => 
                  alt && alt.toLowerCase().includes(searchTermLower)
                )
              : false;
            
            return titleOriginal.includes(searchTermLower) || 
                   titlePtBr.includes(searchTermLower) || 
                   titleAltMatch;
          });
      }

      // Buscar todos os resultados relacionados ao musical pesquisado
      const { data: musicalData, error: musicalError } = await supabase
        .from('versoes')
        .select('*')
        .eq('status', 'active')
        .ilike('musical', `%${searchTermLower}%`)
        .order('titulo_original', { ascending: true });

      let musicalMatches: Verse[] = [];
      if (!musicalError && musicalData) {
        // Filtrar para remover duplicatas
        const existingIds = new Set([
          ...(basicResults.exact ? [basicResults.exact.id] : []),
          ...basicResults.similar.map(v => v.id),
          ...keywordMatches.map(v => v.id)
        ]);
        
        musicalMatches = musicalData.filter(verse => !existingIds.has(verse.id));
      }

      return {
        exact: basicResults.exact,
        similar: basicResults.similar,
        keywordMatches,
        musicalMatches
      };
    } catch (error) {
      console.error('Erro na busca estendida:', error);
      throw error;
    }
  };

  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm.trim()) {
        navigate('/');
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const searchResults = await performExtendedSearch(searchTerm);
        setResults(searchResults);
      } catch (err) {
        console.error('Erro ao buscar:', err);
        setError('Erro ao realizar a busca. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [searchTerm, navigate]);

  const renderVerseCard = (verse: Verse, size: 'large' | 'medium' = 'medium') => {
    const relevantTitle = getRelevantTitle(verse);
    const showOriginalAsSecondary = shouldShowOriginalAsSecondary(verse, relevantTitle);
    const isLarge = size === 'large';
    
    return (
      <Card 
        key={verse.id}
        onClick={() => handleVerseClick(verse.id)}
        className="group overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white cursor-pointer"
      >
        <div className={`flex ${isLarge ? 'p-4' : 'p-3'}`}>
          {/* Coluna da imagem */}
          <div className="flex flex-col items-center mr-4">
            <div className={`${isLarge ? 'w-20 h-20' : 'w-16 h-16'} flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200`}>
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
            {/* Título mais relevante (principal) */}
            <h3 className={`font-bold text-gray-900 ${isLarge ? 'text-lg' : 'text-base'} hover:text-primary transition-colors mb-1`}>
              {displayData(relevantTitle, 'Título não disponível')}
            </h3>
            {/* Título original como secundário (se diferente do relevante) */}
            {showOriginalAsSecondary && (
              <p className={`${isLarge ? 'text-sm' : 'text-xs'} text-gray-600 mb-1 line-clamp-1`}>
                <span className="text-xs text-gray-500">Título original:</span> {verse.titulo_original}
              </p>
            )}
            {/* Musical */}
            <p className={`${isLarge ? 'text-sm' : 'text-xs'} text-gray-600 mb-2 line-clamp-1`}>
              {displayData(verse.musical, 'Musical não informado')}
            </p>
            {/* Classificação vocal e outras informações */}
            <div className="flex flex-wrap gap-1">
              {verse.classificacao_vocal_alt && verse.classificacao_vocal_alt.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {verse.classificacao_vocal_alt.join(', ')}
                </Badge>
              )}
              {verse.ano_gravacao && (
                <Badge variant="outline" className="text-xs">
                  {verse.ano_gravacao}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const totalResults = (
    (results.exact ? 1 : 0) + 
    results.similar.length + 
    results.keywordMatches.length + 
    results.musicalMatches.length
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Cabeçalho da página */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-gray-900">
                Resultados da Busca
              </h1>
            </div>
            <p className="text-lg text-gray-600">
              Resultados para: <span className="font-semibold text-gray-900">"{searchTerm}"</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {totalResults === 0 ? (
            <div className="text-center py-12">
              <Music className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum resultado encontrado
              </h2>
              <p className="text-gray-500 mb-4">
                Tente usar termos diferentes ou verifique a ortografia
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                Voltar ao início
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Resultado Exato */}
              {results.exact && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Correspondência Exata
                    </h2>
                  </div>
                  {renderVerseCard(results.exact, 'large')}
                </section>
              )}

              {/* Correspondências por Palavras-chave */}
              {results.keywordMatches.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Correspondências por Palavras-chave ({results.keywordMatches.length})
                  </h2>
                  <div className="grid gap-4">
                    {results.keywordMatches.map(verse => renderVerseCard(verse))}
                  </div>
                </section>
              )}

              {/* Resultados Similares */}
              {results.similar.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Resultados Similares ({results.similar.length})
                  </h2>
                  <div className="grid gap-4">
                    {results.similar.map(verse => renderVerseCard(verse))}
                  </div>
                </section>
              )}

              {/* Resultados por Musical */}
              {results.musicalMatches.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Todas as Canções do Musical ({results.musicalMatches.length})
                  </h2>
                  <div className="grid gap-4">
                    {results.musicalMatches.map(verse => renderVerseCard(verse))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchResultsPage;