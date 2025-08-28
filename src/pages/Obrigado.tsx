import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Obrigado = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-600">
                Mensagem Enviada com Sucesso!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 text-lg">
                Obrigado por entrar em contato conosco!
              </p>
              <p className="text-gray-600">
                Sua mensagem foi recebida e responderemos o mais breve possível.
              </p>
              <p className="text-gray-600">
                Normalmente respondemos em até 24 horas durante dias úteis.
              </p>
              
              <div className="pt-6">
                <Link to="/">
                  <Button className="w-full sm:w-auto">
                    Voltar ao Início
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Obrigado;