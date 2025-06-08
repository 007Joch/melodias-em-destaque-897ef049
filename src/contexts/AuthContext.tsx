import { createContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
  signOut: () => Promise<any>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Buscar perfil do usuário quando autenticado
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentSession.user.id)
            .single();

          if (error) {
            console.error("Erro ao buscar perfil:", error);
            // Se o perfil não existe, verificar se é um dos admins conhecidos
            if (error.code === 'PGRST116') {
              const adminEmails = ['joabychaves@gmail.com', 'rafoliveira@gmail.com']; // Emails dos administradores
              const userEmail = currentSession.user.email;
              const isAdmin = adminEmails.includes(userEmail || '');
              
              const { data: newProfile, error: createError } = await supabase
                .from("profiles")
                .insert([
                  {
                    id: currentSession.user.id,
                    name: currentSession.user.user_metadata?.name || 'Usuário',
                    role: isAdmin ? 'admin' : 'cliente',
                  },
                ])
                .select()
                .single();
              
              if (createError) {
                console.error("Erro ao criar perfil automaticamente:", createError);
              } else {
                setProfile(newProfile);
              }
            }
          } else {
            setProfile(data);
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // Verificar sessão atual ao carregar
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Buscar perfil do usuário quando autenticado
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentSession.user.id)
            .single();

          if (error) {
            console.error("Erro ao buscar perfil:", error);
            // Se o perfil não existe, verificar se é um dos admins conhecidos
            if (error.code === 'PGRST116') {
              const adminEmails = ['joabychaves@gmail.com', 'rafoliveira@gmail.com']; // Emails dos administradores
              const userEmail = currentSession.user.email;
              const isAdmin = adminEmails.includes(userEmail || '');
              
              const { data: newProfile, error: createError } = await supabase
                .from("profiles")
                .insert([
                  {
                    id: currentSession.user.id,
                    name: currentSession.user.user_metadata?.name || 'Usuário',
                    role: isAdmin ? 'admin' : 'cliente',
                  },
                ])
                .select()
                .single();
              
              if (createError) {
                console.error("Erro ao criar perfil automaticamente:", createError);
              } else {
                setProfile(newProfile);
              }
            }
          } else {
            setProfile(data);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Tentativa de login
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Se o erro for de e-mail não confirmado, informamos ao usuário
      if (result.error?.message?.includes("Email not confirmed")) {
        // Retornamos o resultado com o erro para que a UI possa informar ao usuário
        // que ele precisa confirmar o e-mail
        return result;
      }
      
      return result;
    } catch (error) {
      console.error("Erro no login:", error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
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

      // Se o cadastro for bem-sucedido, criar perfil do usuário como cliente
      if (result.data?.user) {
        const { error } = await supabase.from("profiles").insert([
          {
            id: result.data.user.id,
            name,
            role: 'cliente', // Novos usuários são clientes por padrão
          },
        ]);

        if (error) {
          console.error("Erro ao criar perfil:", error);
        }
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
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};