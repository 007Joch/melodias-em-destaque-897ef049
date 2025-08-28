import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Home, Mail } from 'lucide-react';

const CheckoutPending = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const payment_id = searchParams.get('payment_id');
  const status = searchParams.get('status');

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewOrders = () => {
    navigate('/meus-pedidos');
  };

  const getStatusMessage = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentType = searchParams.get('payment_type');
    
    if (paymentType === 'bank_transfer') {
      return 'Aguardando confirmação da transferência bancária.';
    }
    if (paymentType === 'ticket') {
      return 'Aguardando pagamento do boleto.';
    }
    return 'Seu pagamento está sendo processado.';
  };

  const getInstructions = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentType = searchParams.get('payment_type');
    
    if (paymentType === 'bank_transfer') {
      return [
        'Você receberá um email com os dados para transferência',
        'Realize a transferência em até 3 dias úteis',
        'Após a confirmação, seu pedido será processado'
      ];
    }
    if (paymentType === 'ticket') {
      return [
        'Você receberá um email com o boleto',
        'Pague o boleto em qualquer banco ou lotérica',
        'O prazo de vencimento é de 3 dias úteis'
      ];
    }
    return [
      'Você receberá uma confirmação por email',
      'O processamento pode levar alguns minutos',
      'Acompanhe o status na seção "Meus Pedidos"'
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl text-yellow-600">
            Pagamento Pendente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">
            {getStatusMessage()}
          </p>
          
          {payment_id && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                ID do Pagamento: <span className="font-mono">{payment_id}</span>
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-800">
                Próximos passos:
              </p>
            </div>
            <ul className="text-sm text-blue-700 space-y-1 text-left">
              {getInstructions().map((instruction, index) => (
                <li key={index}>• {instruction}</li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <strong>Importante:</strong> Mantenha este número de pagamento para consultas futuras.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleViewOrders} className="w-full">
              Ver Meus Pedidos
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutPending;