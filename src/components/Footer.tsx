
import { Music } from "lucide-react";

const Footer = () => {
  const handleDesignerClick = () => {
    window.open('https://wa.me/5547991525739', '_blank');
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo e Descrição */}
          <div className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/6d8f4102-632c-4f6f-811d-b38edad74c0c.png" 
              alt="Musical em bom Português" 
              className="h-6 sm:h-8 w-auto"
            />
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center md:justify-end space-x-4 sm:space-x-8 text-xs sm:text-sm text-gray-600">
            <a href="#" className="hover:text-primary transition-colors duration-200">Termos de Uso</a>
            <a href="#" className="hover:text-primary transition-colors duration-200">Política de Privacidade</a>
            <a href="#" className="hover:text-primary transition-colors duration-200">Contato</a>
            <a href="#" className="hover:text-primary transition-colors duration-200">Sobre</a>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            © 2023 Musical em Bom Português | Desenvolvido por {" "}
            <button 
              onClick={handleDesignerClick}
              className="text-primary hover:text-primary/80 transition-colors duration-200 underline cursor-pointer"
            >
              Joaby Chaves - Web Designer
            </button>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
