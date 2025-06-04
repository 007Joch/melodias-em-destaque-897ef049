
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você implementaria a lógica de login
    console.log("Login attempt:", { email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Botão voltar */}
        <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao início
        </Link>

        {/* Logo centralizado */}
        <div className="text-center">
          <img 
            src="/lovable-uploads/6d8f4102-632c-4f6f-811d-b38edad74c0c.png" 
            alt="Musical em bom Português" 
            className="h-20 sm:h-24 w-auto mx-auto mb-8"
          />
        </div>

        {/* Card de Login */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Entrar na sua conta
            </CardTitle>
            <CardDescription className="text-gray-600">
              Acesse sua conta para descobrir mais músicas
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                  required
                />
              </div>

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

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 rounded-full py-3 text-base font-medium"
              >
                Entrar
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Não tem uma conta?{" "}
                <a href="#" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Criar conta
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações adicionais */}
        <p className="text-center text-xs text-gray-500">
          Ao entrar, você concorda com nossos{" "}
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
