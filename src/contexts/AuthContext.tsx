import { createContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name: string, userData?: any) => Promise<any>;
  signOut: () => Promise<any>;
  revalidateSession: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para carregar perfil do usuário
  const loadUserProfile = async (userId: string) => {
    try {
      // Usar função RPC para buscar perfil sem problemas de RLS
      const { data, error } = await supabase
        .rpc('get_user_profile', { user_id: userId });

      if (error) {
        console.error("❌ Erro ao carregar perfil via RPC:", error);
        // Se não conseguir carregar, tentar criar
        await createBasicProfile(userId);
      } else if (data) {
        setProfile(data);
      } else {
        await createBasicProfile(userId);
      }
    } catch (err) {
      console.error('💥 Erro inesperado ao carregar perfil:', err);
      // Fallback: tentar criar perfil básico
      await createBasicProfile(userId);
    }
  };

  // Função para criar perfil básico quando há problemas
  const createBasicProfile = async (userId: string) => {
    try {
      // Obter informações básicas do usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';

      // Usar função RPC para criar perfil sem problemas de RLS
      const { data, error } = await supabase
        .rpc('create_basic_profile', { 
          user_id: userId, 
          user_name: userName 
        });

      if (error) {
        console.error('❌ Erro ao criar perfil básico via RPC:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('💥 Erro ao criar perfil básico:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Função simplificada para atualizar estado
    const updateAuthState = async (session: Session | null) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    };

    // Inicialização simplificada
    const initializeAuth = async () => {
      try {
        // Sempre buscar sessão diretamente do Supabase
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔐 Sessão carregada:', session ? 'Ativa' : 'Inativa');
        await updateAuthState(session);
      } catch (error) {
        console.error('❌ Erro ao inicializar auth:', error);
        setLoading(false);
      }
    };

    // Listener simplificado para mudanças de autenticação
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth change:', event);
        // Usar sempre a sessão fornecida pelo evento
        await updateAuthState(session);
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Função para revalidar sessão quando necessário
  const revalidateSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Erro ao revalidar sessão:', error);
        return false;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      return !!session;
    } catch (error) {
      console.error('💥 Erro ao revalidar sessão:', error);
      return false;
    }
  };

const signIn = async (email: string, password: string) => {
  try {
    // Tentativa de login
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return result;
  } catch (error) {
    console.error("Erro no login:", error);
    return { error };
  }
};

const signUp = async (email: string, password: string, name: string, userData?: any) => {
  try {
    console.log("Dados recebidos no signUp:", { email, name, userData });
    
    // Simplificando o processo de cadastro
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    console.log("Resultado do auth.signUp:", result);

    // Se o cadastro for bem-sucedido, criar ou atualizar perfil do usuário como cliente
    if (result.data?.user && !result.error) {
      const profileData = {
        id: result.data.user.id,
        name,
        role: 'cliente', // Novos usuários são clientes por padrão
        cpf: userData?.cpf || null,
        telefone: userData?.telefone || null,
        endereco: userData?.endereco ? JSON.stringify(userData.endereco) : null,
      };

      console.log("Dados do perfil a serem inseridos:", profileData);
      
      // Tentar inserir o perfil, se falhar por conflito, atualizar
      const { data: insertedData, error } = await supabase
        .from("profiles")
        .upsert([profileData], { onConflict: 'id' })
        .select();

      if (error) {
        console.error("Erro ao criar/atualizar perfil:", error);
      } else {
        console.log("Perfil criado/atualizado com sucesso:", insertedData);
      }
    } else if (result.error) {
      console.log("Erro no auth.signUp, não criando perfil:", result.error);
    }

    return result;
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return { error };
  }
};

const signOut = async () => {
  try {
    const result = await supabase.auth.signOut();
    return result;
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return { error };
  }
};

return (
  <AuthContext.Provider
    value={{
      session,
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      revalidateSession,
    }}
  >
    {children}
  </AuthContext.Provider>
);
};