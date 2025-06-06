
import React, { useState, useEffect, useCallback, useMemo } from "react";
import MusicCard from "./MusicCard";
import { getAllVerses } from '../services/versesService';
import { Database } from '../integrations/supabase/types';
import { Loader2 } from 'lucide-react';

type Verse = Database['public']['Tables']['versoes']['Row'];

const MusicGrid = () => {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(8);

  const fetchVerses = useCallback(async () => {
    try {
      console.log('=== INICIANDO BUSCA DE VERSOS ===');
      setIsLoading(true);
      setError(null);
      
      const data = await getAllVerses();
      
      console.log('=== RESULTADO DA BUSCA ===');
      console.log('Versos retornados:', data.length);
      console.log('Primeiro verso:', data[0]);
      console.log('Estrutura do primeiro verso:', data[0] ? Object.keys(data[0]) : 'Nenhum verso');
      
      setVerses(data);
    } catch (err) {
      console.error('=== ERRO NA BUSCA ===');
      console.error('Erro detalhado:', err);
      setError('Erro ao carregar os versos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerses();
  }, [fetchVerses]);

  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => prev + 8);
  }, []);

  const displayedVerses = useMemo(() => verses.slice(0, displayCount), [verses, displayCount]);
  const hasMoreVerses = useMemo(() => verses.length > displayCount, [verses.length, displayCount]);

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
                onClick={fetchVerses}
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

  console.log('Renderizando grid com', displayedVerses.length, 'versos');

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Explorar Músicas</h2>
          <p className="text-gray-600">Descobrir letras e versões da sua música favorita</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {displayedVerses.map((verse) => {
            console.log('Renderizando card para verso:', {
              id: verse.id,
              titulo_original: verse.titulo_original,
              titulo_pt_br: verse.titulo_pt_br,
              musical: verse.musical,
              estilo: verse.estilo,
              valor: verse.valor
            });
            
            return (
              <MusicCard
                key={verse.id}
                id={verse.id}
                title={verse.titulo_original || verse.titulo_pt_br || 'Título não informado'}
                artist={verse.musical || 'Artista não informado'}
                image={verse.url_imagem || undefined}
                category={verse.estilo?.[0] || 'Musical'}
                views={verse.visualizacoes || 0}
                price={verse.valor || 0}
              />
            );
          })}
        </div>
        
        {hasMoreVerses && (
          <div className="flex justify-center mt-8 sm:mt-12">
            <button
              onClick={handleLoadMore}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Carregar Mais
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default MusicGrid;
