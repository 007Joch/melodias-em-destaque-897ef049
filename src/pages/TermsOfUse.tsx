import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Termos de Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
                <p className="text-justify">
                  Se você pretende estudar ou audicionar, fique à vontade para utilizar as versões deste site. Se 
                  houver espaço, por favor, indique o Musical em Bom Português como origem da versão. 
                  Pede-se a gentileza de não alterar qualquer palavra na versão. Caso deseje fazer qualquer 
                  mudança, entre em{' '}
                  <Link 
                    to="/contato" 
                    className="text-purple-600 hover:text-purple-800 underline font-medium transition-colors duration-200"
                  >
                    contato
                  </Link>
                  , detalhando e justificando sua alteração, para que seja aprovada 
                  ou não. (Ei, já fui acusado injustamente de plágio, por favor me ajude aqui).
                </p>
                
                <p className="text-justify">
                  Caso você pretenda se apresentar, mesmo que seja uma apresentação fechada, entre em{' '}
                  <Link 
                    to="/contato" 
                    className="text-purple-600 hover:text-purple-800 underline font-medium transition-colors duration-200"
                  >
                    contato
                  </Link>{' '}
                  com antecedência, informando todos os detalhes da sua apresentação. Vale lembrar 
                  que os direitos autorais do compositor original deverão ser devidamente recolhidos junto aos 
                  órgãos responsáveis.
                </p>
                
                <p className="text-justify">
                  Está pensando em gravar um vídeo para postar em suas redes sociais? Sinta-se à vontade para 
                  utilizar qualquer versão, peço apenas que marque o perfil do Musical em Bom Português, 
                  dando o devido crédito e deixando o link do site.
                </p>
                
                <p className="text-justify">
                  Qualquer dúvida, ou se seu caso não foi listado, não hesite em entrar em{' '}
                  <Link 
                    to="/contato" 
                    className="text-purple-600 hover:text-purple-800 underline font-medium transition-colors duration-200"
                  >
                    contato
                  </Link>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfUse;