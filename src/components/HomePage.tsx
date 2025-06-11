
import React, { useState, useEffect } from 'react';
import { getVersesPaginated } from '../services/versesService';
import MusicCard from './MusicCard';
import { Loader2, Plus } from 'lucide-react';
import { Database } from '../integrations/supabase/types';
// Removido import de cacheUtils - usando apenas Supabase

type Verse = Database['public']['Tables']['versoes']['Row'];

// Função para obter uma categoria válida
const getCategoryFromVerse = (verse: any): string => {
  // Se tiver estilo como array e não estiver vazio
  if (verse.estilo && Array.isArray(verse.estilo) && verse.estilo.length > 0) {
    return verse.estilo[0];
  }
  
  // Categorias baseadas no nome do musical ou título
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

const HomePage: React.FC = () => {
  const [verses, setVerses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVerses, setTotalVerses] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 50;

  // Função para recarregar dados do Supabase
  const handleReloadData = async () => {
    try {
      console.log('🔄 Recarregando dados do Supabase...');
      setVerses([]);
      setCurrentPage(1);
      setHasMore(true);
      setError(null);
      await fetchInitialVerses();
    } catch (error) {
      console.error('❌ Erro ao recarregar dados:', error);
    }
  };

  const fetchInitialVerses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Iniciando busca de versos na HomePage (dados frescos)...');
      const result = await getVersesPaginated(1, ITEMS_PER_PAGE);
      
      if (!result || !result.data || result.data.length === 0) {
        console.warn('⚠️ Nenhum dado retornado do Supabase');
        setVerses([]);
        setTotalVerses(0);
        setHasMore(false);
        return;
      }
        console.log(`Versos recebidos na HomePage: ${result.data.length} de ${result.total}`);
        setVerses(result.data);
        setTotalVerses(result.total);
        setHasMore(result.hasMore);
        setCurrentPage(1);
      } catch (err) {
        console.error('Erro ao carregar versos na HomePage:', err);
        setError('Erro ao carregar os versos. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchInitialVerses();
  }, []);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    
    try {
      setIsLoadingMore(true);
      setError(null);
      
      const nextPage = currentPage + 1;
      console.log(`Carregando página ${nextPage} com ${ITEMS_PER_PAGE} itens...`);
      
      const result = await getVersesPaginated(nextPage, ITEMS_PER_PAGE);
      console.log(`✅ ${result.data.length} novos versos carregados`);
      
      setVerses(prev => {
        const newVerses = [...prev, ...result.data];
        console.log(`📊 Total de versos carregados: ${newVerses.length}`);
        return newVerses;
      });
      
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
      
    } catch (err) {
      console.error('❌ Erro ao carregar mais versos:', err);
      setError('Erro ao carregar mais versos. Tente novamente.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Mapear dados dos versos para o formato esperado pelo MusicCard sem memoização
  const displayedVerses = verses.map((verse, index) => ({
    id: verse.id,
    title: verse.titulo_original || 'Dados inconsistentes',
    artist: verse.musical || 'Dados inconsistentes',
    image: verse.url_imagem || '/musical-generic.svg',
    category: getCategoryFromVerse(verse),
    views: verse.visualizacoes || 0,
    price: verse.valor || 0, // Valor direto do banco
    classificacoes: verse.classificacao_vocal_alt || [],
    dataIndex: index // Para scroll otimizado
  }));

  if (isLoading) {
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
                onClick={() => {
                  setError(null);
                  setCurrentPage(1);
                  setVerses([]);
                  setHasMore(true);
                  // Recarregar dados sem reload da página
                  const fetchInitialVerses = async () => {
                    try {
                      setIsLoading(true);
                      console.log('🔄 Tentando novamente buscar versos...');
                      const result = await getVersesPaginated(1, ITEMS_PER_PAGE);
                      
                      if (result.data && result.data.length > 0) {
                        const versesWithCategories = result.data.map(verse => ({
                          ...verse,
                          category: getCategoryFromVerse(verse)
                        }));
                        
                        setVerses(versesWithCategories);
                        setTotalVerses(result.total || 0);
                        setHasMore(result.hasMore);
                        console.log('✅ Versos recarregados com sucesso:', result.data.length);
                      } else {
                        console.error('❌ Nenhum verso encontrado');
                        setError('Nenhum verso encontrado');
                      }
                    } catch (error) {
                      console.error('💥 Erro inesperado ao recarregar:', error);
                      setError('Erro inesperado ao carregar versos');
                    } finally {
                      setIsLoading(false);
                    }
                  };
                  fetchInitialVerses();
                }}
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
    return (
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Explorar Músicas</h2>
            <p className="text-gray-600">Descobrir letras e versões da sua música favorita</p>
          </div>
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-600">Nenhum verso encontrado.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Explorar Músicas</h2>
          <p className="text-gray-600">Descobrir letras e versões da sua música favorita</p>
          {totalVerses > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-blue-800 font-medium">
                  📊 <span className="font-bold">{totalVerses}</span> versos disponíveis
                </p>
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-100 px-3 py-1 rounded-full">
                    <span className="text-xs text-blue-700 font-medium">
                      Mostrando {verses.length} versos
                    </span>
                  </div>
                  {(hasMore || verses.length < totalVerses) && (
                     <div className="bg-green-100 px-3 py-1 rounded-full">
                       <span className="text-xs text-green-700 font-medium">
                         +{totalVerses - verses.length} disponíveis
                       </span>
                     </div>
                   )}
                </div>
              </div>
              <div className="mt-2 bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min((verses.length / totalVerses) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {displayedVerses.map((verse) => {
            return (
              <div key={verse.id} data-verse-index={verse.dataIndex}>
                <MusicCard
                  id={verse.id}
                  title={verse.title}
                  artist={verse.artist}
                  image={verse.image}
                  category={verse.category}
                  views={verse.views}
                  price={verse.price}
                  classificacoes={verse.classificacoes}
                />
              </div>
            );
          })}
        </div>
        
        {(hasMore || verses.length < totalVerses) && (
          <div className="flex flex-col items-center mt-8 sm:mt-12 space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-semibold text-gray-800">{verses.length}</span> de <span className="font-semibold text-gray-800">{totalVerses}</span> versos
              </p>
              <p className="text-xs text-gray-500">
                Próximos {Math.min(ITEMS_PER_PAGE, totalVerses - verses.length)} versos serão carregados
              </p>
            </div>
            <button
               onClick={handleLoadMore}
               disabled={isLoadingMore}
               className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
             >
              <div className="flex items-center space-x-3">
                 {isLoadingMore ? (
                   <>
                     <Loader2 className="w-5 h-5 animate-spin" />
                     <span>Carregando mais versos...</span>
                   </>
                 ) : (
                   <>
                     <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                     <span>Carregar Mais {ITEMS_PER_PAGE} Versos</span>
                     <div className="bg-white/20 px-2 py-1 rounded-full">
                       <span className="text-xs font-bold">{Math.min(ITEMS_PER_PAGE, totalVerses - verses.length)}</span>
                     </div>
                   </>
                 )}
               </div>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomePage;
