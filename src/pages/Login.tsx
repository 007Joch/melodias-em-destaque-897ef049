
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Interface para o retorno da função get_all_users
interface UserData {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  raw_user_meta_data: any;
  profile_name: string;
  profile_role: string;
  profile_cpf: string;
  profile_telefone: string;
  profile_endereco: any;
  account_status: string;
  failed_login_attempts: number;
  blocked_until: string | null;
  blocked_reason: string | null;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);
  const [filteredEstados, setFilteredEstados] = useState<string[]>([]);
  const estadoInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [cep, setCep] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [hasValidSession, setHasValidSession] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  
  // Estados para controle de bloqueio de tentativas
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockEndTime, setBlockEndTime] = useState<Date | null>(null);
  const [blockLevel, setBlockLevel] = useState(0); // 0: sem bloqueio, 1: 5min, 2: 30min, 3: permanente
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const totalSteps = 4;
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const estadosBrasileiros = [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
    "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
    "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
    "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
    "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
  ];

  // Funções para gerenciar bloqueio de tentativas
  const getStorageKey = (email: string) => `login_attempts_${email}`;
  const getBlockKey = (email: string) => `login_block_${email}`;

  const loadLoginAttempts = (email: string) => {
    if (!email) return;
    const stored = localStorage.getItem(getStorageKey(email));
    const blockData = localStorage.getItem(getBlockKey(email));
    
    if (stored) {
      const attempts = parseInt(stored, 10);
      setLoginAttempts(attempts);
    }
    
    if (blockData) {
      const { endTime, level } = JSON.parse(blockData);
      const blockEnd = new Date(endTime);
      
      if (blockEnd > new Date()) {
        setIsBlocked(true);
        setBlockEndTime(blockEnd);
        setBlockLevel(level);
      } else {
        // Bloqueio expirou
        localStorage.removeItem(getBlockKey(email));
        setIsBlocked(false);
        setBlockEndTime(null);
        setBlockLevel(level); // Mantém o nível para progressão
        // NÃO reseta as tentativas - mantém para progressão
      }
    }
  };

  const handleFailedLogin = (email: string) => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    localStorage.setItem(getStorageKey(email), newAttempts.toString());
    
    let blockDuration = 0;
    let newBlockLevel = Math.max(blockLevel, 0); // Garante que não seja negativo
    
    // Lógica baseada em ciclos de 3 tentativas
    if (newAttempts % 3 === 0) {
      newBlockLevel++;
      
      if (newBlockLevel === 1) {
        // Primeiro bloqueio: 5 minutos
        blockDuration = 5 * 60 * 1000;
      } else if (newBlockLevel === 2) {
        // Segundo bloqueio: 30 minutos
        blockDuration = 30 * 60 * 1000;
      } else if (newBlockLevel >= 3) {
        // Bloqueio permanente
        newBlockLevel = 3;
      }
    }
    
    if (blockDuration > 0 || newBlockLevel === 3) {
      const endTime = newBlockLevel === 3 ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : new Date(Date.now() + blockDuration);
      setIsBlocked(true);
      setBlockEndTime(endTime);
      setBlockLevel(newBlockLevel);
      
      localStorage.setItem(getBlockKey(email), JSON.stringify({
        endTime: endTime.toISOString(),
        level: newBlockLevel
      }));
      
      let message = "";
      if (newBlockLevel === 1) {
        message = "Muitas tentativas incorretas. Conta bloqueada por 5 minutos.";
      } else if (newBlockLevel === 2) {
        message = "Muitas tentativas incorretas. Conta bloqueada por 30 minutos.";
      } else if (newBlockLevel === 3) {
        message = "Conta bloqueada permanentemente. Para acessar novamente, você deve redefinir sua senha através do link 'Esqueci minha senha'.";
      }
      
      toast({
        title: "Conta Bloqueada",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleSuccessfulLogin = (email: string) => {
    // Limpar tentativas e bloqueios em caso de login bem-sucedido
    localStorage.removeItem(getStorageKey(email));
    localStorage.removeItem(getBlockKey(email));
    setLoginAttempts(0);
    setIsBlocked(false);
    setBlockEndTime(null);
    setBlockLevel(0);
  };

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // useEffect para carregar tentativas de login quando o email muda
  useEffect(() => {
    if (email && !isSignUp) {
      loadLoginAttempts(email);
    }
  }, [email, isSignUp]);

  // useEffect para controlar o timer do bloqueio
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isBlocked && blockEndTime && blockLevel < 3) {
      interval = setInterval(() => {
        const now = new Date();
        const remaining = Math.max(0, Math.floor((blockEndTime.getTime() - now.getTime()) / 1000));
        
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          setIsBlocked(false);
          setBlockEndTime(null);
          if (email) {
            localStorage.removeItem(getBlockKey(email));
            // NÃO remove as tentativas para manter progressão
          }
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBlocked, blockEndTime, blockLevel, email]);

  // useEffect para detectar hash da URL para recuperação de senha
  useEffect(() => {
    // Função para processar o hash da URL
    const processUrlHash = () => {
      const hash = window.location.hash;
      console.log("🔍 Hash detectado:", hash);
      
      if (!hash) {
        console.log("❌ Nenhum hash encontrado na URL");
        return;
      }
      
      // Tenta extrair parâmetros de diferentes formatos de hash
      let params;
      
      // Formato 1: #access_token=xxx&refresh_token=xxx&type=recovery
      if (hash.includes('access_token=')) {
        params = new URLSearchParams(hash.substring(1));
      } 
      // Formato 2: #{"access_token":"xxx","refresh_token":"xxx","type":"recovery"}
      else if (hash.includes('{') && hash.includes('}')) {
        try {
          const jsonStr = decodeURIComponent(hash.substring(1));
          const jsonObj = JSON.parse(jsonStr);
          params = new URLSearchParams();
          Object.entries(jsonObj).forEach(([key, value]) => {
            params.append(key, value as string);
          });
        } catch (e) {
          console.error("❌ Erro ao parsear JSON do hash:", e);
          params = new URLSearchParams(hash.substring(1));
        }
      } 
      // Formato 3: Qualquer outro formato
      else {
        params = new URLSearchParams(hash.substring(1));
      }
      
      console.log("📋 Parâmetros extraídos:", Object.fromEntries(params));

      const type = params.get("type");
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      console.log("🔑 Type:", type, "Access Token:", access_token ? "presente" : "ausente");

      if (access_token) {
        console.log("✅ Configurando sessão...");
        supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || "",
        }).then(({ error }) => {
          if (error) {
            console.error("❌ Erro ao setar sessão:", error);
            toast({
              title: "Erro de autenticação",
              description: "Link inválido ou expirado. Solicite um novo link de recuperação.",
              variant: "destructive",
            });
          } else {
            console.log("✅ Sessão configurada com sucesso!");
            if (type === "recovery") {
              console.log("🔄 Ativando formulário de redefinir senha...");
              setIsResetPassword(true); // 🔥 ativa o form de redefinir senha
              setHasValidSession(true); // indica que há uma sessão válida para reset
              console.log("📝 Estados atualizados - isResetPassword: true, hasValidSession: true");
              toast({
                title: "Link válido!",
                description: "Agora você pode redefinir sua senha.",
              });
            }
            // Aguarda um pouco antes de limpar o hash para garantir que os estados sejam atualizados
            setTimeout(() => {
              // Usamos history.replaceState para não causar uma nova renderização
              history.replaceState(null, document.title, window.location.pathname + window.location.search);
              console.log("🧹 Hash limpo da URL sem recarregar a página");
            }, 500);
          }
        });
      } else {
        console.log("❌ Access token não encontrado nos parâmetros");
      }
    };

    // Processa o hash imediatamente quando o componente é montado
    processUrlHash();

    // Adiciona um listener para detectar mudanças no hash da URL
    window.addEventListener('hashchange', processUrlHash);

    // Remove o listener quando o componente é desmontado
    return () => {
      window.removeEventListener('hashchange', processUrlHash);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEstadoDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEstadoChange = (value: string) => {
    setEstado(value);
    const filtered = estadosBrasileiros.filter(estado =>
      estado.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredEstados(filtered);
    setShowEstadoDropdown(value.length > 0 && filtered.length > 0);
  };

  const selectEstado = (estadoSelecionado: string) => {
    setEstado(estadoSelecionado);
    setShowEstadoDropdown(false);
    setFilteredEstados([]);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Função para verificar se o email existe no banco de dados
  const checkEmailExists = async (email: string) => {
    try {
      // Verificar na tabela auth.users usando a função RPC
      const { data, error } = await supabase.rpc('get_all_users') as { data: UserData[] | null; error: any };
      
      if (error) {
        console.error('Erro ao verificar email:', error);
        return false;
      }
      
      // Verificar se existe um usuário com o email fornecido
      const userExists = data?.some((user: UserData) => user.email === email);
      return !!userExists;
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      return false;
    }
  };

  // Função para verificar email em tempo real
  const handleEmailVerification = async (email: string) => {
    if (!email.trim()) {
      setEmailVerified(false);
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailVerified(false);
      return;
    }

    setVerifyingEmail(true);
    try {
      const exists = await checkEmailExists(email);
      setEmailVerified(exists);
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      setEmailVerified(false);
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Função para enviar email de reset de senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailVerified) {
      toast({
        title: "Email não verificado",
        description: "Por favor, insira um email válido e cadastrado.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    try {
      // Enviar email de reset
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        console.error('Erro ao enviar email de reset:', error);
        toast({
          title: "Erro ao enviar email",
          description: "Ocorreu um erro ao enviar o email de redefinição. Tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada e clique no link para redefinir sua senha.",
        });
        setIsResetPassword(false);
        setResetEmail("");
      }
    } catch (error) {
      console.error('Erro no reset de senha:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  // Função para redefinir senha quando há uma sessão válida
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword.trim()) {
      toast({
        title: "Senha obrigatória",
        description: "Por favor, insira sua nova senha.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A confirmação de senha deve ser igual à nova senha.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    try {
      // Primeiro, obter a sessão atual para pegar o ID do usuário
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        toast({
          title: "Erro",
          description: "Sessão inválida. Tente novamente.",
          variant: "destructive",
        });
        return;
      }
      
      // Verificar se a conta está bloqueada por admin antes de permitir reset
      const { data: userData, error: userError } = await supabase
        .rpc('get_all_users')
        .eq('id', session.user.id)
        .single() as { data: UserData | null; error: any };
      
      if (userError) {
        console.error('Erro ao verificar dados do usuário:', userError);
      } else if (userData?.account_status === 'inactive' && userData?.blocked_reason === 'admin_blocked') {
        toast({
          title: "Conta Bloqueada por Administrador",
          description: "Sua conta foi bloqueada por um administrador. A redefinição de senha não irá reativar sua conta. Entre em contato pelo WhatsApp (11) 94649-3583 para reativação.",
          variant: "destructive",
        });
        return;
      }
      
      // Atualizar a senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Erro ao redefinir senha:', error);
        toast({
          title: "Erro ao redefinir senha",
          description: error.message || "Ocorreu um erro ao redefinir sua senha. Tente novamente.",
          variant: "destructive",
        });
      } else {
        // Resetar tentativas de login falhadas e bloqueios temporários (apenas se não for bloqueio por admin)
        if (userData?.blocked_reason !== 'admin_blocked') {
          await supabase.rpc('reset_failed_login_attempts', {
            user_id: session.user.id
          });
        }
        
        toast({
          title: "Senha redefinida!",
          description: "Sua senha foi redefinida com sucesso. Você será redirecionado para fazer login.",
        });
        
        // Fazer logout para forçar novo login com a nova senha
        await supabase.auth.signOut();
        
        // Resetar estados
        setIsResetPassword(false);
        setHasValidSession(false);
        setNewPassword("");
        setConfirmNewPassword("");
        
        // Redirecionar para login após um breve delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Dados Pessoais
        return name.trim() !== "";
      case 2: // Contato
        return email.trim() !== ""; // CPF e telefone removidos da validação obrigatória
      case 3: // Endereço
        return rua.trim() !== "" && numero.trim() !== "" && bairro.trim() !== "" && cidade.trim() !== "" && estado.trim() !== "" && cep.trim() !== "";
      case 4: // Senha
        return password.trim() !== "" && confirmPassword.trim() !== "" && password === confirmPassword;
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignUp) {
      // Verificar se a conta está bloqueada
      if (isBlocked) {
        if (blockLevel === 3) {
          toast({
            title: "Conta Bloqueada",
            description: "Sua conta foi bloqueada permanentemente. Para acessar novamente, você deve redefinir sua senha através do link 'Esqueci minha senha'.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Conta Temporariamente Bloqueada",
            description: `Sua conta está bloqueada. Tente novamente em ${formatTimeRemaining(timeRemaining)}.`,
            variant: "destructive",
          });
        }
        return;
      }
      
      // Login normal
      setLoading(true);
      try {
        const result = await signIn(email, password);
        
        if (result.error) {
          // Verificar se é erro de conta bloqueada por admin
          if (result.error.status === 'account_blocked_by_admin') {
            toast({
              title: "Conta Bloqueada",
              description: result.error.message,
              variant: "destructive",
            });
          }
          // Verificar se é erro de conta bloqueada temporariamente
          else if (result.error.status === 'account_temporarily_blocked') {
            toast({
              title: "Conta Temporariamente Bloqueada",
              description: result.error.message,
              variant: "destructive",
            });
          }
          // Verificar se é erro de credenciais inválidas
          else if (result.error.message?.includes("Invalid login credentials") || 
              result.error.message?.includes("Invalid credentials") ||
              result.error.message?.includes("Email not confirmed")) {
            // Registrar tentativa falhada
            handleFailedLogin(email);
            
            const attemptsLeft = Math.max(0, 3 - (loginAttempts + 1));
            let description = "E-mail ou senha incorretos.";
            
            if (attemptsLeft > 0 && loginAttempts + 1 < 3) {
              description += ` Você tem mais ${attemptsLeft} tentativa${attemptsLeft > 1 ? 's' : ''} antes do bloqueio.`;
            }
            
            if (!isBlocked) {
              toast({
                title: "Erro de Login",
                description,
                variant: "destructive",
              });
            }
          } else {
            // Traduzir mensagens de erro do Supabase para português
            let errorMessage = result.error.message || "Erro ao fazer login";
            
            if (errorMessage?.includes("User already registered") || 
                errorMessage?.includes("already registered") ||
                errorMessage?.includes("already exists")) {
              errorMessage = "Usuário já registrado";
            } else if (errorMessage?.includes("Password needs to be at least 6 characters") ||
                       errorMessage?.includes("at least 6 characters")) {
              errorMessage = "Senha precisa ter no mínimo 6 caracteres";
            }
            
            toast({
              title: "Erro",
              description: errorMessage,
              variant: "destructive",
            });
          }
        } else {
          // Login bem-sucedido - limpar tentativas e bloqueios
          handleSuccessfulLogin(email);
          
          toast({
            title: "Login realizado!",
            description: "Bem-vindo de volta!",
          });
          navigate("/");
        }
      } catch (error) {
        console.error("Erro inesperado:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro inesperado",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Cadastro por etapas
    if (currentStep < totalSteps) {
      if (validateCurrentStep()) {
        handleNextStep();
      } else {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios antes de continuar",
          variant: "destructive",
        });
      }
    } else {
      // Última etapa - finalizar cadastro
      if (!validateCurrentStep()) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem ou estão vazias",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        const userData = {
          email,
          name,
          cpf,
          telefone,
          endereco: {
            rua,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            cep
          }
        };
        
        console.log("Tentando cadastrar usuário:", userData);
        const result = await signUp(email, password, name, userData);

        if (result.error) {
          console.error("Erro na autenticação:", result.error);
          
          // Traduzir mensagens de erro do Supabase para português
          let errorMessage = result.error.message;
          
          if (errorMessage?.includes("User already registered") || 
              errorMessage?.includes("already registered") ||
              errorMessage?.includes("already exists")) {
            errorMessage = "Usuário já registrado";
          } else if (errorMessage?.includes("Password needs to be at least 6 characters") ||
                     errorMessage?.includes("at least 6 characters")) {
            errorMessage = "Senha precisa ter no mínimo 6 caracteres";
          }
          
          toast({
            title: "Erro",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Cadastro realizado!",
            description: "Conta criada com sucesso! Redirecionando...",
          });
          // Redirecionar para homepage já logado
          setTimeout(() => {
            navigate("/");
          }, 1500);
        }
      } catch (error) {
        console.error("Erro inesperado:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro inesperado",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-2">
        {/* Card de Login/Cadastro */}
        <Card className="border-0 shadow-xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="text-center relative">
            {/* Botão Voltar ao início */} 
            <Link to="/" className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex items-center text-primary hover:text-primary/80 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            {/* Logo centralizado - Mesmo tamanho do header */}
            <div className="text-center">
              <img 
                src="/lovable-uploads/6d8f4102-632c-4f6f-811d-b38edad74c0c.png" 
                alt="Musical em bom Português" 
                className="h-48 sm:h-56 md:h-64 lg:h-72 w-auto mx-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isResetPassword ? "Redefinir Senha" : (isSignUp ? "Criar conta" : "Entrar na sua conta")}
            </CardTitle>
            {isSignUp && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Etapa {currentStep} de {totalSteps}
                  </span>
                  <span className="text-sm text-gray-500">
                    {currentStep === 1 && "Dados Pessoais"}
                    {currentStep === 2 && "Contato"}
                    {currentStep === 3 && "Endereço"}
                    {currentStep === 4 && "Senha"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Formulário de Reset de Senha */}
            {isResetPassword && !hasValidSession && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail" className="text-gray-700 font-medium">
                    Email *
                  </Label>
                  <div className="relative">
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="Digite seu email"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        handleEmailVerification(e.target.value);
                      }}
                      className={`rounded-full border-gray-200 focus:border-primary focus:ring-primary/20 ${
                        resetEmail && !verifyingEmail ? 
                          (emailVerified ? 'border-green-500' : 'border-red-500') : ''
                      }`}
                      required
                    />
                    {verifyingEmail && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                  {resetEmail && !verifyingEmail && (
                    <p className={`text-sm mt-1 ${
                      emailVerified ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {emailVerified ? '✓ Email encontrado no sistema' : '✗ Email não encontrado no sistema'}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsResetPassword(false);
                      setResetEmail("");
                      setEmailVerified(false);
                      setVerifyingEmail(false);
                    }}
                    variant="outline"
                    className="flex-1 rounded-full py-3 text-base font-medium"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={resetLoading || !emailVerified || verifyingEmail}
                    className="flex-1 bg-primary hover:bg-primary/90 rounded-full py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? "Enviando..." : "Redefinir Senha"}
                  </Button>
                </div>
              </form>
            )}

            {/* Formulário de Nova Senha (quando há sessão válida) */}
            {isResetPassword && hasValidSession && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-700 font-medium">
                    Nova Senha *
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Digite sua nova senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword" className="text-gray-700 font-medium">
                    Confirmar Nova Senha *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmNewPassword"
                      type={showConfirmNewPassword ? "text" : "password"}
                      placeholder="Confirme sua nova senha"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsResetPassword(false);
                      setHasValidSession(false);
                      setNewPassword("");
                      setConfirmNewPassword("");
                    }}
                    variant="outline"
                    className="flex-1 rounded-full py-3 text-base font-medium"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={resetLoading || !newPassword || !confirmNewPassword}
                    className="flex-1 bg-primary hover:bg-primary/90 rounded-full py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? "Redefinindo..." : "Redefinir Senha"}
                  </Button>
                </div>

                <div className="text-center text-sm text-gray-600 mt-4">
                  Após redefinir sua senha, você será redirecionado para fazer login novamente.
                </div>
              </form>
            )}

            {/* Formulário Principal (Login/Cadastro) */}
            {!isResetPassword && (
              <form onSubmit={handleSubmit} className="space-y-4">
              {/* Etapa 1: Dados Pessoais */}
              {isSignUp && currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 font-medium">
                      Nome completo *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Etapa 2: Contato */}
              {isSignUp && currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">
                      E-mail *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="text-gray-700 font-medium">
                      CPF (opcional)
                    </Label>
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-gray-700 font-medium">
                      Telefone *
                    </Label>
                    <Input
                      id="telefone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Etapa 3: Endereço */}
              {isSignUp && currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="rua" className="text-gray-700 font-medium">
                        Rua *
                      </Label>
                      <Input
                        id="rua"
                        type="text"
                        placeholder="Nome da rua"
                        value={rua}
                        onChange={(e) => setRua(e.target.value)}
                        className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="numero" className="text-gray-700 font-medium">
                        Número *
                      </Label>
                      <Input
                        id="numero"
                        type="text"
                        placeholder="123"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complemento" className="text-gray-700 font-medium">
                      Complemento (opcional)
                    </Label>
                    <Input
                      id="complemento"
                      type="text"
                      placeholder="Apartamento, bloco, etc."
                      value={complemento}
                      onChange={(e) => setComplemento(e.target.value)}
                      className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="bairro" className="text-gray-700 font-medium">
                        Bairro *
                      </Label>
                      <Input
                        id="bairro"
                        type="text"
                        placeholder="Nome do bairro"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cidade" className="text-gray-700 font-medium">
                        Cidade *
                      </Label>
                      <Input
                        id="cidade"
                        type="text"
                        placeholder="Nome da cidade"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2 relative" ref={dropdownRef}>
                      <Label htmlFor="estado" className="text-gray-700 font-medium">
                        Estado *
                      </Label>
                      <div className="relative">
                        <Input
                          ref={estadoInputRef}
                          id="estado"
                          type="text"
                          placeholder="Digite ou selecione um estado"
                          value={estado}
                          onChange={(e) => handleEstadoChange(e.target.value)}
                          onFocus={() => {
                            if (estado.length === 0) {
                              setFilteredEstados(estadosBrasileiros);
                              setShowEstadoDropdown(true);
                            }
                          }}
                          className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20 pr-10"
                          required
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (showEstadoDropdown) {
                              setShowEstadoDropdown(false);
                            } else {
                              setFilteredEstados(estadosBrasileiros);
                              setShowEstadoDropdown(true);
                              estadoInputRef.current?.focus();
                            }
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${showEstadoDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showEstadoDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredEstados.length > 0 ? (
                              filteredEstados.map((estadoOption, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => selectEstado(estadoOption)}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                                >
                                  {estadoOption}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-500 text-sm">
                                Nenhum estado encontrado
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cep" className="text-gray-700 font-medium">
                        CEP *
                      </Label>
                      <Input
                        id="cep"
                        type="text"
                        placeholder="00000-000"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Etapa 4: Senha */}
              {isSignUp && currentStep === 4 && (
                <div className="space-y-4">
                  <div className="space-y-2 relative">
                    <Label htmlFor="password" className="text-gray-700 font-medium">
                      Criar senha *
                    </Label>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-0 pr-4 flex items-center text-gray-500"
                      style={{ top: '50%' }}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                      Repetir senha *
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute right-0 pr-4 flex items-center text-gray-500"
                      style={{ top: '50%' }}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Login Form */}
              {!isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2 relative">
                    <Label htmlFor="password" className="text-gray-700 font-medium">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-0 pr-4 flex items-center text-gray-500"
                      style={{ top: '50%' }}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Status do bloqueio */}
                  {isBlocked && (
                    <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-red-700">
                          {blockLevel === 3 
                            ? 'Conta bloqueada permanentemente'
                            : `Conta temporariamente bloqueada`
                          }
                        </span>
                      </div>
                      {blockLevel !== 3 && (
                        <p className="text-xs text-red-600 mt-1">
                          Tempo restante: {formatTimeRemaining(timeRemaining)}
                        </p>
                      )}
                      {blockLevel === 3 && (
                        <p className="text-xs text-red-600 mt-1">
                          Use "Esqueceu a senha?" para redefinir sua senha
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Tentativas restantes */}
                  {!isBlocked && loginAttempts > 0 && (
                    <div className="p-3 rounded-lg border border-yellow-200 bg-yellow-50">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-yellow-700">
                          {3 - loginAttempts} tentativa(s) restante(s) antes do bloqueio
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isSignUp && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary/20"
                    />
                    <span className="ml-2 text-gray-600">Lembrar de mim</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsResetPassword(true)}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              {/* Botões de navegação e submit */}
              <div className="flex gap-3 pt-4">
                {isSignUp && currentStep > 1 && (
                  <Button
                    type="button"
                    onClick={handlePrevStep}
                    variant="outline"
                    className="flex-1 rounded-full py-3 text-base font-medium"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                )}
                
                <Button
                  type="submit"
                  disabled={loading}
                  className={`${isSignUp && currentStep > 1 ? 'flex-1' : 'w-full'} bg-primary hover:bg-primary/90 rounded-full py-3 text-base font-medium`}
                >
                  {loading ? "Carregando..." : (
                    !isSignUp ? "Entrar" :
                    currentStep < totalSteps ? (
                      <>
                        Próximo
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    ) : "Finalizar Cadastro"
                  )}
                </Button>
              </div>
            </form>
            )}

            <div className="mt-4 text-center">
              <p className="text-gray-600">
                {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setCurrentStep(1); // Reset para primeira etapa
                  }}
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  {isSignUp ? "Fazer login" : "Criar conta"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações adicionais */}
        <p className="text-center text-xs text-gray-500">
          Ao {isSignUp ? "criar uma conta" : "entrar"}, você concorda com nossos{" "}
          <Link to="/termos-de-uso" className="text-primary hover:text-primary/80">
            Termos de Uso
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
