
import { Search, User, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">Musical</span>
          </div>

          {/* Barra de Busca Central */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
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

          {/* Menu do Usuário */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="rounded-full">
              <User className="w-5 h-5" />
              <span className="ml-2 hidden md:inline">Entrar</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
