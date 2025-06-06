
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
      console.log('=== MusicGrid: INICIANDO BUSCA ===');
      setIsLoading(true);
      setError(null);
      
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

  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => prev + 8);
  }, []);

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
