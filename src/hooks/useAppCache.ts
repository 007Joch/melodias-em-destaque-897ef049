
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export const useAppCache = () => {
  const queryClient = useQueryClient();

  // Função simplificada para limpar cache específico
  const clearCache = useCallback((keys?: string[]) => {
    try {
      if (keys && keys.length > 0) {
        keys.forEach(key => {
          queryClient.removeQueries({ queryKey: [key] });
        });
      } else {
        queryClient.clear();
      }
      console.log('Cache limpo:', keys || 'todos');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }, [queryClient]);

  // Função simplificada para invalidar queries específicas
  const invalidateQueries = useCallback((keys: string[]) => {
    try {
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      console.log('Queries invalidadas:', keys);
    } catch (error) {
      console.error('Erro ao invalidar queries:', error);
    }
  }, [queryClient]);

  // Função simplificada para pré-carregar dados
  const prefetchData = useCallback(async (key: string, fetcher: () => Promise<any>) => {
    try {
      await queryClient.prefetchQuery({
        queryKey: [key],
        queryFn: fetcher,
        staleTime: 2 * 60 * 1000, // 2 minutos apenas
      });
    } catch (error) {
      console.error('Erro ao pré-carregar dados:', error);
    }
  }, [queryClient]);

  // Função para resetar cache
  const resetCache = useCallback(() => {
    try {
      queryClient.clear();
      console.log('Cache resetado');
    } catch (error) {
      console.error('Erro ao resetar cache:', error);
    }
  }, [queryClient]);

  return {
    clearCache,
    invalidateQueries,
    prefetchData,
    resetCache,
    queryClient
  };
};
