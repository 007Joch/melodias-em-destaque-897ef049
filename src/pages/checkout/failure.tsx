import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Home, RotateCcw } from 'lucide-react';

const CheckoutFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const payment_id = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const status_detail = searchParams.get('status_detail');

  const handleGoHome = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    navigate('/checkout');
  };

  const getErrorMessage = () => {
    if (status_detail) {
      switch (status_detail) {
        case 'cc_rejected_insufficient_amount':
          return 'Cartão sem limite suficiente.';
        case 'cc_rejected_bad_filled_card_number':
          return 'Número do cartão inválido.';
        case 'cc_rejected_bad_filled_date':
          return 'Data de vencimento inválida.';
        case 'cc_rejected_bad_filled_security_code':
          return 'Código de segurança inválido.';
        case 'cc_rejected_call_for_authorize':
          return 'Pagamento rejeitado. Entre em contato com seu banco.';
        default:
          return 'Pagamento não pôde ser processado.';
      }
    }
    return 'Ocorreu um erro durante o processamento do pagamento.';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">
            Pagamento Rejeitado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">
            {getErrorMessage()}
          </p>
          
          {payment_id && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                ID do Pagamento: <span className="font-mono">{payment_id}</span>
              </p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Dicas:</strong>
            </p>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1 text-left">
              <li>• Verifique os dados do cartão</li>
              <li>• Confirme se há limite disponível</li>
              <li>• Tente outro método de pagamento</li>
              <li>• Entre em contato com seu banco</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleTryAgain} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Tentar Novamente
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

export default CheckoutFailure;