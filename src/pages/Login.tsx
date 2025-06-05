
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuthHook";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        console.log("Tentando cadastrar usuário:", { email, name });
        result = await signUp(email, password, name);
      } else {
        console.log("Tentando fazer login:", { email });
        result = await signIn(email, password);
      }

      console.log("Resultado da operação:", result);

      if (result.error) {
        console.error("Erro na autenticação:", result.error);
        toast({
          title: "Erro",
          description: `${result.error.message} (Código: ${result.error.status || 'desconhecido'})`,
          variant: "destructive",
        });
      } else {
        toast({
          title: isSignUp ? "Cadastro realizado!" : "Login realizado!",
          description: isSignUp ? "Conta criada com sucesso" : "Bem-vindo de volta!",
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-2">
        {/* Card de Login/Cadastro */}
        <Card className="border-0 shadow-xl">
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
            {/* <CardDescription className="text-gray-600">
              {isSignUp ? "Cadastre-se para descobrir mais músicas" : "Acesse sua conta para descobrir mais músicas"}
            </CardDescription> */}
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium">
                    Nome completo
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
              )}
              
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 rounded-full py-3 text-base font-medium"
              >
                {loading ? "Carregando..." : (isSignUp ? "Criar conta" : "Entrar")}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-gray-600">
                {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
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
