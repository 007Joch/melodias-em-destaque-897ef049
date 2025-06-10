
import React from "react";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  
  // Função para sempre obter dados reais da sessão do Supabase
  const getCurrentSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Erro ao obter sessão atual:', error);
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('💥 Erro inesperado ao obter sessão:', error);
      return null;
    }
  };
  
  // Função para verificar se o usuário está realmente autenticado
  const isReallyAuthenticated = async () => {
    const session = await getCurrentSession();
    return !!session && !!session.user;
  };
  
  return {
    ...context,
    getCurrentSession,
    isReallyAuthenticated,
  };
};
