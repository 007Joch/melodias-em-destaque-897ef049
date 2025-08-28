import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Contact = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    setIsLoading(true);
    
    try {
      await fetch('https://formsubmit.co/rafoliveira@gmail.com', {
        method: 'POST',
        body: new FormData(form)
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
                
                <div className="pt-6 space-y-3">
                  <Link to="/">
                    <Button className="w-full sm:w-auto">
                      Voltar ao Início
                    </Button>
                  </Link>
                  <div>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsSubmitted(false)}
                      className="w-full sm:w-auto"
                    >
                      Enviar Nova Mensagem
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  Formulário de Contato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Campos ocultos para configuração do FormSubmit */}
                  <input type="hidden" name="_honey" style={{display: 'none'}} />
                  <input type="hidden" name="_captcha" value="false" />
                  
                  <div className="space-y-2">
                    <Label htmlFor="nome">Seu nome (obrigatório)</Label>
                    <Input
                      id="nome"
                      name="nome"
                      type="text"
                      required
                      placeholder="Digite seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Seu e-mail (obrigatório)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assunto">Assunto</Label>
                    <Input
                      id="assunto"
                      name="assunto"
                      type="text"
                      placeholder="Assunto da sua mensagem"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensagem">Sua mensagem</Label>
                    <Textarea
                      id="mensagem"
                      name="mensagem"
                      placeholder="Digite sua mensagem aqui..."
                      rows={5}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Mensagem'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
    </div>
  );
};

export default Contact;