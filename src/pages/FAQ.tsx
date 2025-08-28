import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQ = () => {
  const faqData = [
    {
      question: "Quanto tempo demora para ter acesso à versão depois do pagamento?",
      answer: "Assim que o pagamento for aprovado você já terá acesso à versão através do site. Basta acessar estando logado com o usuário utilizado para efetuar a compra e clicar no link da versão comprada. A aprovação costuma ser automática para pagamentos via PIX ou cartão de crédito. Se o pagamento já foi aprovado e você ainda não consegue acessar a versão através do site, tente entrar pelo link enviado pelo seu e-mail ou pelos pedidos no \"Meus Pedidos\". Se ainda assim tiver problemas, entre em contato ou me mande uma mensagem pelo WhatsApp, meu número estará no e-mail de confirmação."
    },
    {
      question: "Não encontro a versão que eu preciso no site, o que eu faço?",
      answer: "Se você não encontrou a versão através da busca, você pode tentar procurar nos filtros pelo título da canção, pelo título do musical ou classificação vocal. Se ainda assim você não conseguiu encontrar sua versão, entre em contato, especificando qual versão gostaria de ver no site."
    },
    {
      question: "Você disponibiliza partituras ou os instrumentais (karaokês) das canções?",
      answer: "As versões que estiverem com o ícone 🎤 no final do nome são as que possuem instrumental disponível. Infelizmente, ainda não disponibilizo as partituras. Entenda que você está comprando apenas a versão em português, que é o que eu posso vender, pois é fruto do meu trabalho. O instrumental não pertence a mim, não possuo qualquer direito sobre ele. Apenas encontrei na internet e estou disponibilizando com o objetivo de facilitar o seu estudo."
    },
    {
      question: "Eu consigo um áudio gravado das versões que encontro nesse site?",
      answer: "O Musical em Bom Português disponibiliza apenas as versões em português no formato de texto para você mesmo possa cantar as canções. Não disponibilizo um áudio gravado das canções."
    },
    {
      question: "Minha compra foi concluída, como tenho acesso às versões?",
      answer: "Se você adquiriu uma versão avulsa, assim que o pagamento for aprovado você já terá acesso à versão através do site. Basta acessar estando logado com o usuário utilizado para efetuar a compra e clicar no link da versão comprada. A aprovação costuma ser automática para pagamentos via PIX ou cartão de crédito. Se o pagamento já foi aprovado e você ainda não consegue acessar a versão através do site, tente entrar pelo link enviado pelo seu e-mail ou pelos pedidos no Minha Conta. Se ainda assim tiver problemas, entre em contato ou me mande uma mensagem pelo WhatsApp, meu número estará no e-mail de confirmação."
    },
    {
      question: "O que é uma versão?",
      answer: "A versão é uma tradução de uma letra de música. Mas não é uma tradução comum, eu me preocupo em manter a métrica, as rimas, as sílabas tônicas e mais vários outros aspectos (como as vogais nas notas agudas) na tentativa de manter a canção tão agradável aos ouvidos quanto o original.\n\nÉ importante ressaltar que, neste site, a versão é apresentada apenas no formato de texto. Você terá uma referência do áudio em inglês para te ajudar a encaixar a versão na métrica, mas você não encontrará uma gravação da música, apenas o texto."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center">
                  Perguntas Frequentes
                </CardTitle>
                <p className="text-center text-gray-600 mt-2">
                  Encontre respostas para as dúvidas mais comuns sobre nossos serviços
                </p>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqData.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
  );
};

export default FAQ;