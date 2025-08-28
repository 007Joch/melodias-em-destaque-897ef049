import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { hasUserPurchasedVerse } from '@/services/purchaseService';
import { getVerse } from '@/services/versesService';
import LoadingSpinner from '@/components/LoadingSpinner';

interface VerseAccessGuardProps {
  children: React.ReactNode;
}

const VerseAccessGuard: React.FC<VerseAccessGuardProps> = ({ children }) => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, profileLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Validação se o ID é numérico
  const isValidVerseId = (value: string) => /^\d+$/.test(value);

  useEffect(() => {
    const checkAccess = async () => {
      // Se autenticação/perfil ainda estão carregando, aguardar antes de decidir
      if (authLoading || profileLoading) {
        setLoading(true);
        return;
      }

      if (!id || !isValidVerseId(id)) {
        // Sem identificador válido, redirecionar para home
        navigate('/', { replace: true });
        return;
      }

      try {
        setLoading(true);

        // Buscar o verso primeiro para obter o ID numérico
        const verse = await getVerse(id);

        if (!verse) {
          // Verso não encontrado, redirecionar para home
          navigate('/', { replace: true });
          return;
        }

        if (!user) {
          // Usuário não logado (visitante), redirecionar para preview
          navigate(`/preview/${verse.id}`, { replace: true });
          return;
        }

        // Verificar o tipo de usuário
        const userRole = profile?.role;

        // Admin e Membro têm acesso direto
        if (userRole === 'admin' || userRole === 'membro') {
          setHasAccess(true);
          return;
        }

        // Para clientes, verificar se compraram o verso
        const hasPurchased = await hasUserPurchasedVerse(user.id, verse.id);

        if (hasPurchased) {
          setHasAccess(true);
        } else {
          // Cliente não comprou, redirecionar para preview
          navigate(`/preview/${verse.id}`, { replace: true });
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        // Em caso de erro, redirecionar para home por segurança
        navigate('/', { replace: true });
        return;
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [id, user, navigate, profile, authLoading, profileLoading]);

  if (loading || authLoading || profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
        <span className="ml-2">Verificando acesso...</span>
      </div>
    );
  }

  if (!hasAccess) {
    // Este estado não deveria ser alcançado devido aos redirecionamentos,
    // mas incluímos como fallback
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
};

export default VerseAccessGuard;