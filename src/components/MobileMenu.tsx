
import { useState } from "react";
import { Menu, Home, Music, ShoppingCart, User, LogOut, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuthHook";
import { Link } from "react-router-dom";

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, profile } = useAuth();

  const menuItems = [
    { icon: Home, label: "Início", href: "/" },
    { icon: Music, label: "Músicas", href: "/" },
    { icon: List, label: "Gerenciar Versos", href: "/manage-verses" },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-full">
          <Menu className="w-5 h-5" />
          <span className="ml-2 hidden sm:inline">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header do Menu */}
          <div className="flex items-center justify-between p-6 border-b">
            {/* <img 
              src="/lovable-uploads/6d8f4102-632c-4f6f-811d-b38edad74c0c.png" 
              alt="Musical em bom Português" 
              className="h-8 w-auto"
            /> */}
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button> */}
          </div>

          {/* Informações do Usuário */}
          {user && (
            <div className="p-6 border-b bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{profile?.name || 'Usuário'}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {profile?.role === 'admin' && (
                    <span className="inline-block px-2 py-1 text-xs bg-primary text-white rounded-full mt-1">
                      Administrador
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Footer do Menu */}
          <div className="p-6 border-t">
            {user ? (
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full justify-start"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <Button className="w-full">
                  <User className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
