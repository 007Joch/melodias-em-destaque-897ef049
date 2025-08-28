import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Interface para tipar o retorno da função get_all_users
interface UserData {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  account_status?: string;
  failed_login_attempts?: number;
  blocked_until?: string;
  blocked_reason?: string;
  created_at?: string;
  updated_at?: string;
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name: string, userData?: any) => Promise<any>;
  signOut: () => Promise<any>;
  revalidateSession: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Função para carregar perfil do usuário
  const loadUserProfile = async (userId: string) => {
    try {
      console.log('🔍 [loadUserProfile] Iniciando busca do perfil para usuário:', userId);
      setProfileLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ [loadUserProfile] Erro ao carregar perfil:', error);
        
        // Se o perfil não existe (PGRST116), criar um perfil básico
        if (error.code === 'PGRST116') {
          console.log('⚠️ [loadUserProfile] Perfil não encontrado, criando perfil básico...');
          
          // Tentar obter informações do usuário para criar o perfil
          const { data: { user } } = await supabase.auth.getUser();
          const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
          
          try {
            const newProfile = await createBasicProfile(userId, userName);
            console.log('✅ [loadUserProfile] Perfil básico criado:', newProfile);
            setProfile(newProfile);
            return newProfile;
          } catch (createError) {
            console.error('❌ [loadUserProfile] Erro ao criar perfil básico:', createError);
            // Criar um perfil mínimo local como fallback
            const fallbackProfile = {
              id: userId,
              name: userName,
              role: 'cliente',
              created_at: new Date().toISOString()
            };
            setProfile(fallbackProfile);
            return fallbackProfile;
          }
        }
        
        setProfile(null);
        throw error;
      }
      
      console.log('✅ [loadUserProfile] Perfil carregado com sucesso:', data);
      setProfile(data);
      return data;
    } catch (error: any) {
      console.error('❌ [loadUserProfile] Erro geral ao carregar perfil:', error);
      setProfile(null);
      throw error;
    } finally {
      setProfileLoading(false);
    }
  };

  // Função para criar perfil básico quando necessário - APENAS para novos usuários
  const createBasicProfile = async (userId: string, userName: string) => {
    try {
      console.log('🔧 Verificando se usuário já possui perfil:', userId);
      
      // Primeiro, verificar se o perfil já existe
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (existingProfile && !checkError) {
        console.log('✅ Perfil já existe, retornando perfil existente:', existingProfile);
        return existingProfile;
      }

      console.log('🔧 Criando perfil básico para usuário:', userId);
      
      const { data, error } = await supabase
        .rpc('create_basic_profile', { 
          user_id: userId, 
          user_name: userName 
        });

      if (error) {
        console.error('❌ Erro ao criar perfil básico via RPC:', error);
        throw error;
      }

      console.log('✅ Perfil criado via RPC:', data);
      return data;
    } catch (err) {
      console.error('💥 Erro ao criar perfil básico:', err);
      throw err;
    }
  };

  // useEffect para monitorar mudanças no perfil e forçar logout se conta bloqueada
  useEffect(() => {
    if (user && profile) {
      // Verificar se a conta está bloqueada por administrador
      if (profile.account_status === 'inactive' && profile.blocked_reason === 'admin_blocked') {
        console.log('🚫 [AuthContext] Conta bloqueada por administrador - forçando logout');
        signOut();
        return;
      }

      // Verificar se a conta está bloqueada temporariamente
      if (profile.blocked_until) {
        const blockedUntil = new Date(profile.blocked_until);
        const now = new Date();
        
        if (now < blockedUntil) {
          console.log('🚫 [AuthContext] Conta bloqueada temporariamente - forçando logout');
          signOut();
          return;
        }
      }
    }
  }, [user, profile]);

  useEffect(() => {
    let mounted = true;

    // Inicialização simples e direta
    const initializeAuth = async () => {
      try {
        console.log('🔐 Verificando sessão inicial...');
        setProfileLoading(true); // Definir profileLoading como true no início
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error);
        }
        
        if (mounted) {
          if (session) {
            console.log('✅ Sessão ativa encontrada:', session.user.email);
            setSession(session);
            setUser(session.user);
            
            // Tentar carregar perfil uma única vez
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (profileData && !profileError) {
                console.log('✅ Perfil carregado:', profileData);
                setProfile(profileData);
              } else {
                console.log('⚠️ Perfil não encontrado, usando dados básicos');
                // Criar perfil básico local sem tentar salvar no banco
                const basicProfile = {
                  id: session.user.id,
                  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
                  role: 'cliente',
                  created_at: new Date().toISOString()
                };
                setProfile(basicProfile);
              }
            } catch (profileError) {
              console.log('⚠️ Erro ao carregar perfil, usando fallback');
              const fallbackProfile = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
                role: 'cliente',
                created_at: new Date().toISOString()
              };
              setProfile(fallbackProfile);
            }
          } else {
            console.log('❌ Nenhuma sessão ativa');
            setSession(null);
            setUser(null);
            setProfile(null);
          }
          
          setLoading(false);
          setProfileLoading(false); // Definir profileLoading como false no final
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar auth:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          setProfileLoading(false); // Definir profileLoading como false em caso de erro
        }
      }
    };

    // Listener simplificado
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('🔔 Auth change:', event, session?.user?.email || 'no session');
        
        if (event === 'SIGNED_OUT' || !session) {
          console.log('🚪 Usuário deslogado');
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN') {
          console.log('🔑 Usuário logado');
          setSession(session);
          setUser(session.user);
          // Não recarregar perfil aqui para evitar loops
          setLoading(false);
        }
      }
    );

    // Inicializar
    initializeAuth();

    // Cleanup
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Função simplificada para verificar sessão sem causar problemas de cache
  const revalidateSession = async () => {
    try {
      console.log('🔄 Verificando sessão atual...');
      
      // Apenas verificar se a sessão ainda existe, sem forçar recarregamento
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('❌ Sessão não encontrada');
        return false;
      }
      
      console.log('✅ Sessão ainda válida');
      return true;
    } catch (error) {
      console.error('💥 Erro ao verificar sessão:', error);
      return false;
    }
  };

const signIn = async (email: string, password: string) => {
  try {
    console.log('🔑 Tentando fazer login...');
    
    // PRIMEIRO: Verificar se a conta existe e seu status ANTES de tentar fazer login
    try {
      const { data: userData, error: userError } = await supabase
        .rpc('get_all_users')
        .eq('email', email)
        .single() as { data: UserData | null, error: any };
      
      if (!userError && userData) {
        // Verificar se a conta está bloqueada por admin ANTES de tentar login
        if (userData?.account_status === 'inactive' && userData?.blocked_reason === 'admin_blocked') {
          return {
            error: {
              message: 'Sua conta foi bloqueada por um administrador. Para reativar sua conta, entre em contato pelo WhatsApp (11) 94649-3583 ou acesse nossa página de contato.',
              status: 'account_blocked_by_admin'
            }
          };
        }
        
        // Verificar se a conta está bloqueada temporariamente ANTES de tentar login
        if (userData?.blocked_until) {
          const blockedUntil = new Date(userData.blocked_until);
          const now = new Date();
          
          if (now < blockedUntil) {
            return {
              error: {
                message: `Sua conta está temporariamente bloqueada até ${blockedUntil.toLocaleString('pt-BR')}. Aguarde ou redefina sua senha.`,
                status: 'account_temporarily_blocked'
              }
            };
          }
        }
      }
    } catch (checkError) {
      console.log('⚠️ Erro ao verificar status da conta antes do login:', checkError);
      // Continuar com o login mesmo se não conseguir verificar o status
    }
    
    // SEGUNDO: Fazer login apenas se a conta não estiver bloqueada
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (result.error) {
      console.error('❌ Erro no login:', result.error);
      return result;
    }
    
    if (result.data?.session?.user) {
      console.log('✅ Login bem-sucedido');
      
      // Carregar o perfil normalmente
      try {
        const userProfile = await loadUserProfile(result.data.session.user.id);
        setProfile(userProfile);
        console.log('✅ Perfil carregado após login:', userProfile);
      } catch (profileError) {
        console.log('⚠️ Perfil não encontrado, tentando criar...');
        
        try {
          const userName = result.data.session.user.user_metadata?.name || 
                          result.data.session.user.email?.split('@')[0] || 
                          'Usuário';
          
          const newProfile = await createBasicProfile(result.data.session.user.id, userName);
          setProfile(newProfile);
          console.log('✅ Perfil criado após login:', newProfile);
        } catch (createError) {
          console.error('❌ Erro ao criar perfil:', createError);
          // Continuar mesmo sem perfil
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erro no login:', error);
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
    console.log('🚪 Fazendo logout...');
    
    // Fazer logout no Supabase
    const result = await supabase.auth.signOut();
    
    // Limpar estado local
    setSession(null);
    setUser(null);
    setProfile(null);
    
    console.log('✅ Logout realizado com sucesso');
    return result;
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
    
    // Mesmo com erro, limpar estado local
    setSession(null);
    setUser(null);
    setProfile(null);
    
    return { error };
  }
};

return (
  <AuthContext.Provider
    value={{
      session,
      user,
      profile,
      loading: loading || profileLoading,
      profileLoading,
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