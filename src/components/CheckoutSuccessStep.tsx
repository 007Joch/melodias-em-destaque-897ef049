
import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CheckoutSuccessStepProps {
  paymentId: string;
  totalAmount: number;
  onClose: () => void;
}

const CheckoutSuccessStep = ({ paymentId, totalAmount, onClose }: CheckoutSuccessStepProps) => {
  const navigate = useNavigate();

  const formatDate = () => {
    return new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="text-center space-y-6 py-8">
      {/* Ícone de sucesso */}
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
      </div>

      {/* Título e descrição */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Pagamento Aprovado!
        </h3>

      </div>

      {/* Informações do pedido */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">ID do Pagamento:</span>
          <span className="font-medium">{paymentId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Data:</span>
          <span className="font-medium">{formatDate()}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total Pago:</span>
          <span className="text-primary">
            R$ {totalAmount.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {/* Próximos passos */}
      <div className="text-left bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Próximos passos:</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <p>Você receberá um e-mail de confirmação com os detalhes da compra e um link para baixar o arquivo PDF da versão.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <p>Os links para acesso no site e download do PDF também estarão disponíveis no menu <button onClick={() => { onClose(); navigate('/meus-pedidos'); }} className="text-primary underline hover:text-primary/80 font-medium">meus pedidos</button>.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <p>Em caso de dúvidas, entre em contato conosco pelo e-mail <a href="mailto:rafoliveira@gmail.com" className="text-primary underline hover:text-primary/80">rafoliveira@gmail.com</a> ou pelo WhatsApp no número <a href="https://wa.me/5511946493583" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">+55 11 94649-3583</a>.</p>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="space-y-3">
        <Button
          onClick={onClose}
          className="w-full"
        >
          <Home className="w-4 h-4 mr-2" />
          Continuar Navegando
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            onClose();
            navigate('/meus-pedidos');
          }}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          Ver Meus Pedidos
        </Button>
      </div>
      
      {/* Mensagem de agradecimento */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-1">
          Obrigado pela sua compra! 🎵
        </h4>
        <p className="text-sm text-gray-600">
          Agradecemos sua confiança no Musical em bom português. Bons estudos!
        </p>
      </div>
    </div>
  );
};

export default CheckoutSuccessStep;
