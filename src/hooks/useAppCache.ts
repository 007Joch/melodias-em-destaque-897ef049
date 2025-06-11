import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';

export const useAppCache = () => {
  const queryClient = useQueryClient();

  // Função para limpar cache específico
  const clearCache = useCallback((keys?: string[]) => {
    try {
      if (keys && keys.length > 0) {
        keys.forEach(key => {
          queryClient.removeQueries({ queryKey: [key] });
          queryClient.cancelQueries({ queryKey: [key] });
        });
      } else {
        queryClient.clear();
      }
      console.log('Cache limpo:', keys || 'todos');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }, [queryClient]);

  // Função para invalidar queries específicas
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

  // Função para pré-carregar dados
  const prefetchData = useCallback(async (key: string, fetcher: () => Promise<any>) => {
    try {
      await queryClient.prefetchQuery({
        queryKey: [key],
        queryFn: fetcher,
        staleTime: 5 * 60 * 1000, // 5 minutos
      });
    } catch (error) {
      console.error('Erro ao pré-carregar dados:', error);
    }
  }, [queryClient]);

  // Função para resetar completamente o cache
  const resetCache = useCallback(() => {
    try {
      queryClient.clear();
      queryClient.getQueryCache().clear();
      queryClient.getMutationCache().clear();
      console.log('Cache completamente resetado');
    } catch (error) {
      console.error('Erro ao resetar cache:', error);
    }
  }, [queryClient]);

  // Limpeza automática do cache em intervalos
  useEffect(() => {
    const interval = setInterval(() => {
      // Limpa cache antigo a cada 15 minutos
      const cacheTime = Date.now() - (15 * 60 * 1000);
      queryClient.getQueryCache().findAll().forEach(query => {
        if (query.state.dataUpdatedAt < cacheTime) {
          queryClient.removeQueries({ queryKey: query.queryKey });
        }
      });
      console.log('Limpeza automática de cache executada');
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // Limpeza do cache ao recarregar a página
  useEffect(() => {
    const handleBeforeUnload = () => {
      resetCache();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Limpa cache quando a aba fica inativa
        clearCache();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient, resetCache, clearCache]);

  // Limpeza inicial ao montar o componente
  useEffect(() => {
    // Limpa cache antigo na inicialização
    const oldCacheKeys = ['old-verses', 'old-categories', 'temp-data'];
    clearCache(oldCacheKeys);
  }, [clearCache]);

  return {
    clearCache,
    invalidateQueries,
    prefetchData,
    resetCache,
    queryClient
  };
};