import React, { createContext, useContext, useEffect, useState } from "react";
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
          const userName = user?.raw_user_meta_data?.name || user?.email?.split('@')[0] || 'Usuário';
          
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

  useEffect(() => {
    let mounted = true;

    // Inicialização simples e direta
    const initializeAuth = async () => {
      try {
        console.log('🔐 Verificando sessão inicial...');
        
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
                  name: session.user.raw_user_meta_data?.name || session.user.email?.split('@')[0] || 'Usuário',
                  role: 'cliente',
                  created_at: new Date().toISOString()
                };
                setProfile(basicProfile);
              }
            } catch (profileError) {
              console.log('⚠️ Erro ao carregar perfil, usando fallback');
              const fallbackProfile = {
                id: session.user.id,
                name: session.user.raw_user_meta_data?.name || session.user.email?.split('@')[0] || 'Usuário',
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
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar auth:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
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
    
    // Fazer login
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
      
      // Agora sim, carregar o perfil
      try {
        const userProfile = await loadUserProfile(result.data.session.user.id);
        setProfile(userProfile);
        console.log('✅ Perfil carregado após login:', userProfile);
      } catch (profileError) {
        console.log('⚠️ Perfil não encontrado, tentando criar...');
        
        try {
          const userName = result.data.session.user.raw_user_meta_data?.name || 
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
    console.log("🔍 Dados recebidos no signUp:", { email, name, userData });
    
    // Verificar se userData tem os campos necessários
    if (userData) {
      console.log("📋 Detalhes do userData:", {
        cpf: userData.cpf,
        telefone: userData.telefone,
        endereco: userData.endereco
      });
    }
    
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

    console.log("📤 Resultado do auth.signUp:", result);

    // Se o cadastro for bem-sucedido, criar ou atualizar perfil do usuário como cliente
    if (result.data?.user && !result.error) {
      // Preparar dados do endereço
      let enderecoJson = null;
      if (userData?.endereco) {
        try {
          enderecoJson = JSON.stringify(userData.endereco);
          console.log("🏠 Endereço serializado:", enderecoJson);
        } catch (err) {
          console.error("❌ Erro ao serializar endereço:", err);
        }
      }

      const profileData = {
        id: result.data.user.id,
        name: name?.trim() || '',
        role: 'cliente', // Novos usuários são clientes por padrão
        cpf: userData?.cpf?.trim() || null,
        telefone: userData?.telefone?.trim() || null,
        endereco: enderecoJson,
      };

      console.log("💾 Dados do perfil a serem inseridos:", profileData);
      
      // Tentar inserir o perfil, se falhar por conflito, atualizar
      const { data: insertedData, error } = await supabase
        .from("profiles")
        .upsert([profileData], { onConflict: 'id' })
        .select();

      if (error) {
        console.error("❌ Erro ao criar/atualizar perfil:", error);
        console.error("❌ Detalhes do erro:", JSON.stringify(error, null, 2));
      } else {
        console.log("✅ Perfil criado/atualizado com sucesso:", insertedData);
        
        // Verificar se os dados foram realmente salvos
        const { data: verifyData, error: verifyError } = await supabase
          .from("profiles")
          .select('*')
          .eq('id', result.data.user.id)
          .single();
          
        if (verifyError) {
          console.error("❌ Erro ao verificar perfil salvo:", verifyError);
        } else {
          console.log("🔍 Perfil verificado após inserção:", verifyData);
        }
      }
    } else if (result.error) {
      console.log("❌ Erro no auth.signUp, não criando perfil:", result.error);
    }

    return result;
  } catch (error) {
    console.error("❌ Erro no cadastro:", error);
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