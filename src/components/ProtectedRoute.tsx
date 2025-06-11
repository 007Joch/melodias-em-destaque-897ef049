import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  allowedRoles = [],
  redirectTo = '/'
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Aguardar carregamento apenas por um tempo limitado
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Se requer autenticação mas usuário não está logado
  if (requireAuth && !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Se especifica roles permitidas, verificar permissão
  if (allowedRoles.length > 0) {
    // Se não está logado, redirecionar
    if (!user) {
      return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Usar role do perfil ou assumir 'cliente' como padrão
    const userRole = profile?.role || 'cliente';
    
    console.log('🔐 [ProtectedRoute] Verificando permissões:', {
      userRole,
      allowedRoles,
      hasProfile: !!profile
    });
    
    if (!allowedRoles.includes(userRole)) {
      console.log('❌ [ProtectedRoute] Acesso negado - role não permitida');
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;