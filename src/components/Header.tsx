
import { Search, User, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuthHook";
import { useState } from "react";
import { Link } from "react-router-dom";
import CartDrawer from "./CartDrawer";
import MobileMenu from "./MobileMenu";

const Header = () => {
  const { getTotalItems } = useCart();
  const { user } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const totalItems = getTotalItems();

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Menu Hambúrguer */}
            <div className="flex items-center space-x-4">
              {user && <MobileMenu />}
              
              {/* Logo - Aumentado ainda mais */}
              <div className="flex items-center space-x-2 flex-shrink-0 max-h-32 overflow-hidden">
                <img 
                  src="/lovable-uploads/6d8f4102-632c-4f6f-811d-b38edad74c0c.png" 
                  alt="Musical em bom Português" 
                  className="h-36 sm:h-40 md:h-44 lg:h-48 w-auto"
                />
              </div>
            </div>

            {/* Barra de Busca Central - Hidden on mobile, visible on tablet+ */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Procure por músicas, artistas, letras..."
                  className="w-full pl-12 pr-4 py-3 text-lg bg-gray-50 border-0 rounded-full focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
                <Button
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-primary hover:bg-primary/90"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Menu do Usuário e Carrinho */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Carrinho */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full relative"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary animate-pulse"
                  >
                    {totalItems}
                  </Badge>
                )}
                <span className="ml-2 hidden sm:inline">Carrinho</span>
              </Button>

              {/* Botão Entrar - Visível apenas para usuários não logados */}
              {!user && (
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="rounded-full">
                    <User className="w-5 h-5" />
                    <span className="ml-2 hidden sm:inline">Entrar</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Barra de Busca Mobile - Visible only on mobile */}
          <div className="md:hidden mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Procurar músicas..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-0 rounded-full focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
              <Button
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full bg-primary hover:bg-primary/90 h-8 w-8 p-0"
              >
                <Search className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;
