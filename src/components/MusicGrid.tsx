
import React, { useState, useEffect, useCallback, useMemo } from "react";
import MusicCard from "./MusicCard";
import FilterBar from "./FilterBar";
import { getVersesPaginated } from '../services/versesService';
import { useAppCache } from '../hooks/useAppCache';
import { Database } from '../integrations/supabase/types';
import { Loader2 } from 'lucide-react';

type Verse = Database['public']['Tables']['versoes']['Row'];

// Função auxiliar para obter uma categoria válida
const getCategoryFromVerse = (verse: Verse): string => {
  // Verificamos se estilo existe, é um array e tem elementos
  if (verse.estilo && Array.isArray(verse.estilo) && verse.estilo.length > 0) {
    return verse.estilo[0];
  }
  
  // Categorias padrão baseadas no nome do musical ou título
  const musicalLower = (verse.musical || '').toLowerCase();
  const titleLower = (verse.titulo_pt_br || '').toLowerCase();
  
  if (musicalLower.includes('hamilton') || titleLower.includes('hamilton')) {
    return 'Hip Hop';
  } else if (musicalLower.includes('miseráveis') || musicalLower.includes('miserables') || titleLower.includes('miseráveis')) {
    return 'Drama Musical';
  } else if (musicalLower.includes('rei leão') || musicalLower.includes('lion king') || titleLower.includes('hakuna')) {
    return 'Animação';
  }
  
  // Categoria padrão
  return 'Teatro Musical';
};

// Função auxiliar para obter uma imagem válida
const getImageFromVerse = (verse: Verse): string => {
  return verse.url_imagem || '/musical-generic.svg';
};

const MusicGrid = () => {
  const { clearCache, invalidateQueries } = useAppCache();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVerses, setTotalVerses] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all-styles');
  const [selectedSort, setSelectedSort] = useState<string>('popular');
  const ITEMS_PER_PAGE = 50;

<<<<<<< HEAD
  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchInitialVerses = async () => {
=======
  const fetchVerses = useCallback(async () => {
>>>>>>> abd277ab6c88590b3fcb587a9672bcda1c8713d4
    try {
      console.log('=== MusicGrid: INICIANDO BUSCA ===');
      setIsLoading(true);
      setError(null);
      
<<<<<<< HEAD
      // Limpa cache antigo para evitar problemas de navegação
      clearCache(['musicgrid-verses']);
      
      console.log('Iniciando busca de versos...');
      const result = await getVersesPaginated(1, ITEMS_PER_PAGE);
      console.log(`Versos recebidos: ${result.data.length} de ${result.total}`);
      setVerses(result.data);
      setTotalVerses(result.total);
      setHasMoreData(result.hasMore);
      setCurrentPage(1);
=======
      const data = await getAllVerses();
      
      console.log('=== MusicGrid: DADOS RECEBIDOS ===');
      console.log('Tipo dos dados:', typeof data);
      console.log('É array?', Array.isArray(data));
      console.log('Length:', data?.length);
      console.log('Dados completos:', data);
      
      if (!data) {
        console.log('=== MusicGrid: DADOS NULOS ===');
        setVerses([]);
        return;
      }
      
      if (!Array.isArray(data)) {
        console.error('=== MusicGrid: DADOS NÃO SÃO ARRAY ===');
        console.error('Tipo recebido:', typeof data);
        console.error('Valor:', data);
        setError('Formato de dados inválido recebido do servidor');
        return;
      }
      
      console.log('=== MusicGrid: DEFININDO VERSOS ===');
      console.log('Definindo verses com:', data.length, 'itens');
      setVerses(data);
      
      console.log('=== MusicGrid: VERSOS DEFINIDOS ===');
      console.log('Estado verses atualizado');
      
>>>>>>> abd277ab6c88590b3fcb587a9672bcda1c8713d4
    } catch (err) {
      console.error('=== MusicGrid: ERRO NA BUSCA ===');
      console.error('Tipo do erro:', typeof err);
      console.error('Erro completo:', err);
      console.error('Stack trace:', err instanceof Error ? err.stack : 'Não disponível');
      setError('Erro ao carregar os versos. Tente novamente.');
    } finally {
      console.log('=== MusicGrid: FINALIZANDO BUSCA ===');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
<<<<<<< HEAD
    if (!hasInitialized) {
      setHasInitialized(true);
      fetchInitialVerses();
    }
  }, [clearCache]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreData) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      console.log(`Carregando página ${nextPage}...`);
      
      const result = await getVersesPaginated(nextPage, ITEMS_PER_PAGE);
      console.log(`Novos versos carregados: ${result.data.length}`);
      
      setVerses(prev => [...prev, ...result.data]);
      setHasMoreData(result.hasMore);
      setCurrentPage(nextPage);
      
      // Invalida cache para manter dados atualizados
      invalidateQueries(['verses', 'musicgrid-verses']);
    } catch (err) {
      console.error('Erro ao carregar mais versos:', err);
      setError('Erro ao carregar mais versos.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreData, currentPage, invalidateQueries]);

  // Funções de filtro
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);
=======
    console.log('=== MusicGrid: useEffect TRIGGERED ===');
    fetchVerses();
  }, [fetchVerses]);

  // Log quando o estado de verses muda
  useEffect(() => {
    console.log('=== MusicGrid: ESTADO verses MUDOU ===');
    console.log('Novo estado verses:', verses);
    console.log('Length do estado:', verses.length);
    console.log('Primeiro item do estado:', verses[0]);
  }, [verses]);
>>>>>>> abd277ab6c88590b3fcb587a9672bcda1c8713d4

  const handleStyleChange = useCallback((style: string) => {
    setSelectedStyle(style);
  }, []);

<<<<<<< HEAD
  const handleSortChange = useCallback((sort: string) => {
    setSelectedSort(sort);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedCategory('all');
    setSelectedStyle('all-styles');
    setSelectedSort('popular');
  }, []);

  // Filtrar e ordenar versos
  const filteredAndSortedVerses = useMemo(() => {
    let filtered = [...verses];

    // Filtrar por categoria
    if (selectedCategory !== 'all') {
      const categoryName = selectedCategory.replace(/-/g, ' ');
      filtered = filtered.filter(verse => {
        const verseCategory = getCategoryFromVerse(verse).toLowerCase();
        return verseCategory.includes(categoryName.toLowerCase());
      });
    }

    // Filtrar por estilo
    if (selectedStyle !== 'all-styles') {
      const styleName = selectedStyle.replace(/-/g, ' ');
      filtered = filtered.filter(verse => {
        if (verse.estilo && Array.isArray(verse.estilo) && verse.estilo.length > 0) {
          return verse.estilo.some(style => 
            style.toLowerCase().includes(styleName.toLowerCase())
          );
        }
        return false;
      });
    }

    // Ordenar
    switch (selectedSort) {
      case 'mais-recentes':
        filtered.sort((a, b) => new Date(b.criada_em || '').getTime() - new Date(a.criada_em || '').getTime());
        break;
      case 'a-z':
        filtered.sort((a, b) => (a.titulo_pt_br || '').localeCompare(b.titulo_pt_br || ''));
        break;
      case 'z-a':
        filtered.sort((a, b) => (b.titulo_pt_br || '').localeCompare(a.titulo_pt_br || ''));
        break;
      case 'por-artista':
        filtered.sort((a, b) => (a.musical || '').localeCompare(b.musical || ''));
        break;
      case 'mais-populares':
      default:
        filtered.sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0));
        break;
    }

    return filtered;
  }, [verses, selectedCategory, selectedStyle, selectedSort]);

  const displayedVerses = useMemo(() => filteredAndSortedVerses, [filteredAndSortedVerses]);

  const hasMoreVerses = useMemo(() => hasMoreData, [hasMoreData]);
=======
  const displayedVerses = useMemo(() => {
    console.log('=== MusicGrid: CALCULANDO displayedVerses ===');
    console.log('verses.length:', verses.length);
    console.log('displayCount:', displayCount);
    const result = verses.slice(0, displayCount);
    console.log('displayedVerses result:', result);
    console.log('displayedVerses length:', result.length);
    return result;
  }, [verses, displayCount]);
  
  const hasMoreVerses = useMemo(() => verses.length > displayCount, [verses.length, displayCount]);
>>>>>>> abd277ab6c88590b3fcb587a9672bcda1c8713d4

  console.log('=== MusicGrid: RENDERIZAÇÃO ===');
  console.log('isLoading:', isLoading);
  console.log('error:', error);
  console.log('verses.length:', verses.length);
  console.log('displayedVerses.length:', displayedVerses.length);

  if (isLoading) {
    console.log('=== MusicGrid: RENDERIZANDO LOADING ===');
    return (
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Explorar Músicas</h2>
            <p className="text-gray-600">Descobrir letras e versões da sua música favorita</p>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-gray-600">Carregando versos...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    console.log('=== MusicGrid: RENDERIZANDO ERROR ===');
    return (
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Explorar Músicas</h2>
            <p className="text-gray-600">Descobrir letras e versões da sua música favorita</p>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={fetchInitialVerses}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (verses.length === 0) {
    console.log('=== MusicGrid: RENDERIZANDO EMPTY STATE ===');
    return (
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Explorar Músicas</h2>
            <p className="text-gray-600">Descobrir letras e versões da sua música favorita</p>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Nenhum verso encontrado na tabela versoes.</p>
              <p className="text-sm text-gray-500 mb-4">
                Verifique se existem registros na tabela ou se estão com status correto.
              </p>
              <button 
                onClick={fetchVerses}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Recarregar
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  console.log('=== MusicGrid: RENDERIZANDO GRID ===');
  console.log('Renderizando grid com', displayedVerses.length, 'versos');

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Explorar Músicas</h2>
          <p className="text-gray-600">Descobrir letras e versões da sua música favorita</p>
        </div>
        
<<<<<<< HEAD
        <FilterBar
          onCategoryChange={handleCategoryChange}
          onStyleChange={handleStyleChange}
          onSortChange={handleSortChange}
          onClearFilters={handleClearFilters}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-6">
          {displayedVerses.map((verse) => (
            <MusicCard
              key={verse.id}
              id={verse.id}
              title={verse.titulo_original || 'Dados inconsistentes'}
            artist={verse.musical || 'Dados inconsistentes'}
              image={getImageFromVerse(verse)}
              category={getCategoryFromVerse(verse)}
              views={verse.visualizacoes || 0}
              price={verse.valor ? verse.valor / 100 : 0} // Converter de centavos para reais
              classificacoes={verse.classificacao_vocal_alt}
            />
          ))}
=======
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {displayedVerses.map((verse, index) => {
            console.log(`=== MusicGrid: RENDERIZANDO CARD ${index} ===`);
            console.log('Verso completo:', verse);
            console.log('ID:', verse.id);
            console.log('titulo_original:', verse.titulo_original);
            console.log('musical:', verse.musical);
            console.log('estilo:', verse.estilo);
            console.log('valor:', verse.valor);
            console.log('url_imagem:', verse.url_imagem);
            
            return (
              <MusicCard
                key={verse.id}
                id={verse.id}
                title={verse.titulo_original || 'Título não informado'}
                artist={verse.musical || 'Artista não informado'}
                image={verse.url_imagem || undefined}
                category={verse.estilo?.[0] || 'Musical'}
                views={verse.visualizacoes || 0}
                price={verse.valor || 0}
              />
            );
          })}
>>>>>>> abd277ab6c88590b3fcb587a9672bcda1c8713d4
        </div>
        
        {hasMoreVerses && (
          <div className="flex flex-col items-center mt-8 sm:mt-12 space-y-2">
            <p className="text-sm text-gray-600">
              Mostrando {verses.length} de {totalVerses} versos
            </p>
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Carregando...</span>
                </>
              ) : (
                <span>Carregar Mais</span>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default MusicGrid;
