import React, { useState, useEffect } from "react";
import MusicCard from "./MusicCard";
import { getVersesPaginated } from '../services/versesService';
import { Database } from '../integrations/supabase/types';
import { Loader2 } from 'lucide-react';
import { DEFAULT_VERSE_IMAGE } from '@/constants/images';

type Verse = Database['public']['Tables']['versoes']['Row'];

// Função auxiliar para obter uma imagem válida
const getImageFromVerse = (verse: Verse): string => {
  return verse.url_imagem || DEFAULT_VERSE_IMAGE;
};

// Função auxiliar para garantir dados consistentes
const ensureVerseData = (verse: any) => {
  // Garantir que apenas versões com títulos válidos sejam processadas
  const title = verse.titulo_original || verse.titulo_pt_br;
  if (!title || title.trim() === '') {
    return null; // Retorna null para versões sem título válido
  }
  
  return {
    ...verse,
    title: title.trim(),
    artist: verse.musical || 'Artista não informado',
    image: verse.url_imagem && verse.url_imagem !== 'null' ? verse.url_imagem : DEFAULT_VERSE_IMAGE,
    price: verse.valor || 0, // Valor direto do banco
    category: verse.estilo && Array.isArray(verse.estilo) && verse.estilo.length > 0 ? verse.estilo[0] : 'Teatro Musical',
    classificacoes: verse.classificacao_vocal_alt
  };
};

const MusicGrid = () => {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVerses, setTotalVerses] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);


  const ITEMS_PER_PAGE = 50;

  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchInitialVerses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Iniciando busca de versos...');
      const result = await getVersesPaginated(1, ITEMS_PER_PAGE);
      console.log(`Versos recebidos: ${result.data.length} de ${result.total}`);
      setVerses(result.data);
      setTotalVerses(result.total);
      setHasMoreData(result.hasMore);
      setCurrentPage(1);
    } catch (err) {
      console.error('Erro ao carregar versos:', err);
      setError('Erro ao carregar os versos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      fetchInitialVerses();
    }
  }, []);

  const handleLoadMore = async () => {
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
      

    } catch (err) {
      console.error('Erro ao carregar mais versos:', err);
      setError('Erro ao carregar mais versos.');
    } finally {
      setIsLoadingMore(false);
    }
  };



  // Ordenar versos alfabeticamente por titulo_original
  const sortedVerses = [...verses].sort((a, b) => {
    const titleA = (a.titulo_original || '').trim();
    const titleB = (b.titulo_original || '').trim();
    return titleA.localeCompare(titleB, 'pt-BR', { sensitivity: 'base' });
  });

  const displayedVerses = sortedVerses;
  const hasMoreVerses = hasMoreData;

  if (isLoading) {
    return (
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-gray-600">Carregando versões...</span>
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
    return (
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-600">Nenhuma versão encontrada.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">


        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-6">
          {displayedVerses.map((verse) => {
            const verseData = ensureVerseData(verse);
            
            // Pular versões sem título válido
            if (!verseData) {
              console.log('⚠️ Verso ignorado por não ter título válido:', verse.id);
              return null;
            }
            
            console.log('🎵 Renderizando verso:', {
              id: verse.id,
              title: verseData.title,
              image: verseData.image,
              price: verseData.price
            });
            
            return (
              <MusicCard
                key={verse.id}
                id={verse.id}
                title={verseData.title}
                artist={verseData.artist}
                image={verseData.image}
                category={verseData.category}
                price={verseData.price}
                classificacoes={verseData.classificacoes}
              />
            );
          }).filter(Boolean)}
        </div>
        
        {hasMoreVerses && (
          <div className="flex flex-col items-center mt-8 sm:mt-12 space-y-2">
            <p className="text-sm text-gray-600">
              Mostrando {verses.length} de {totalVerses} versões
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
