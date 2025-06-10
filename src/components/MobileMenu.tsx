
import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, Music, List, Users, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, profile, loading } = useAuth();

  // Definir itens do menu - visíveis apenas para usuários logados
  const menuItems = React.useMemo(() => {
    const baseItems = [
      { icon: Home, label: "Início", href: "/" },
      { icon: Music, label: "Músicas", href: "/music" }
    ];

    // Adicionar itens de gerenciamento apenas para admins
    if (profile?.role === 'admin') {
      baseItems.push(
        { icon: List, label: "Gerenciar Versos", href: "/manage-verses" },
        { icon: Users, label: "Gerenciar Usuários", href: "/manage-users" }
      );
    }

    return baseItems;
  }, [profile?.role]);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  // Não exibir o menu para usuários não logados
  if (!user) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-full">
          <Menu className="w-5 h-5" />
          <span className="ml-2 hidden sm:inline">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <VisuallyHidden>
          <SheetTitle>Menu de Navegação</SheetTitle>
          <SheetDescription>Menu principal para navegação no site</SheetDescription>
        </VisuallyHidden>
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
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
