
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Download } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface CheckoutSuccessStepProps {
  paymentId: string;
  onClose: () => void;
}

const CheckoutSuccessStep = ({ paymentId, onClose }: CheckoutSuccessStepProps) => {
  const { getTotalPrice } = useCart();
  const totalAmount = getTotalPrice();

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
        <p className="text-gray-600">
          Seu pedido foi processado com sucesso
        </p>
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
        <h4 className="font-medium mb-2">Próximos Passos:</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <p>Você receberá um email de confirmação com os detalhes da compra</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <p>Os links para download estarão disponíveis em sua conta</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <p>Em caso de dúvidas, entre em contato conosco</p>
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
          onClick={() => window.location.href = "/minha-conta"}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          Ir para Minha Conta
        </Button>
      </div>
      
      {/* Mensagem de agradecimento */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-1">
          Obrigado pela sua compra! 🎵
        </h4>
        <p className="text-sm text-gray-600">
          Esperamos que você aproveite sua música em bom português!
        </p>
      </div>
    </div>
  );
};

export default CheckoutSuccessStep;
