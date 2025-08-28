import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Music } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/hooks/useCart";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: Usuário tentou acessar rota inexistente:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">

            
            {/* Título principal */}
            <h1 className="text-6xl font-bold text-gray-900 mb-4">
              404
            </h1>
            
            {/* Mensagem amigável */}
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">
              Opa! Página não encontrada!
            </h2>
            
            <p className="text-lg text-gray-600 mb-8 max-w-md">
              A página que você está procurando não existe ou foi movida.
            </p>
            
            {/* Botão de volta */}
            <Link to="/">
              <Button size="lg" className="px-8 py-3">
                <Home className="w-5 h-5 mr-2" />
                Voltar
              </Button>
            </Link>
            

          </div>
        </main>
        
        <Footer />
      </div>
    </CartProvider>
  );
};

export default NotFound;