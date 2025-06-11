
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

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

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Dados Pessoais
        return name.trim() !== "";
      case 2: // Contato
        return email.trim() !== "" && cpf.trim() !== "" && telefone.trim() !== "";
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
      // Login normal
      setLoading(true);
      try {
        const result = await signIn(email, password);
        
        if (result.error) {
          // Verificar se é erro de credenciais inválidas
          if (result.error.message?.includes("Invalid login credentials") || 
              result.error.message?.includes("Invalid credentials") ||
              result.error.message?.includes("Email not confirmed")) {
            toast({
              title: "Erro de Login",
              description: "E-mail ou senha incorretos. Se você não tem uma conta, clique em 'Criar conta' abaixo.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erro",
              description: result.error.message || "Erro ao fazer login",
              variant: "destructive",
            });
          }
        } else {
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
        // Verificar todos os campos antes de enviar
        console.log("🔍 Dados do formulário antes do envio:", {
          email: email?.trim(),
          name: name?.trim(),
          cpf: cpf?.trim(),
          telefone: telefone?.trim(),
          endereco: {
            rua: rua?.trim(),
            numero: numero?.trim(),
            complemento: complemento?.trim(),
            bairro: bairro?.trim(),
            cidade: cidade?.trim(),
            estado: estado?.trim(),
            cep: cep?.trim()
          }
        });

        const userData = {
          email: email?.trim(),
          name: name?.trim(),
          cpf: cpf?.trim(),
          telefone: telefone?.trim(),
          endereco: {
            rua: rua?.trim(),
            numero: numero?.trim(),
            complemento: complemento?.trim() || '',
            bairro: bairro?.trim(),
            cidade: cidade?.trim(),
            estado: estado?.trim(),
            cep: cep?.trim()
          }
        };
        
        console.log("📤 Tentando cadastrar usuário:", userData);
        console.log("📋 Verificação de campos obrigatórios:", {
          emailOk: !!userData.email,
          nameOk: !!userData.name,
          cpfOk: !!userData.cpf,
          telefoneOk: !!userData.telefone,
          enderecoOk: !!(userData.endereco.rua && userData.endereco.numero && userData.endereco.bairro && userData.endereco.cidade && userData.endereco.estado && userData.endereco.cep)
        });
        
        const result = await signUp(email?.trim(), password, name?.trim(), userData);

        if (result.error) {
          console.error("Erro na autenticação:", result.error);
          toast({
            title: "Erro",
            description: `${result.error.message} (Código: ${result.error.status || 'desconhecido'})`,
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
              {isSignUp ? "Criar conta" : "Entrar na sua conta"}
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
                      CPF *
                    </Label>
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                      required
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
                  <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                    Esqueceu a senha?
                  </a>
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
          <a href="#" className="text-primary hover:text-primary/80">
            Termos de Uso
          </a>{" "}
          e{" "}
          <a href="#" className="text-primary hover:text-primary/80">
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
