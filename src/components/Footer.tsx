
import { Music } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo e Descrição */}
          <div className="flex items-center space-x-2 mb-6 md:mb-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">Musical</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center md:justify-end space-x-8 text-sm text-gray-600">
            <a href="#" className="hover:text-primary transition-colors duration-200">Termos de Uso</a>
            <a href="#" className="hover:text-primary transition-colors duration-200">Política de Privacidade</a>
            <a href="#" className="hover:text-primary transition-colors duration-200">Contato</a>
            <a href="#" className="hover:text-primary transition-colors duration-200">Sobre</a>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-500">
            © 2024 Musical. Todos os direitos reservados. Plataforma dedicada à descoberta e compartilhamento de letras musicais.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
