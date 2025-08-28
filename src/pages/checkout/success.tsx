import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const payment_id = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const external_reference = searchParams.get('external_reference');

  useEffect(() => {
    // Limpar carrinho quando o pagamento for aprovado
    if (status === 'approved') {
      clearCart();
      toast({
        title: "Pagamento aprovado!",
        description: "Seu pedido foi processado com sucesso."
      });
    }
  }, [status, clearCart]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewOrders = () => {
    navigate('/meus-pedidos');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Pagamento Aprovado!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">
            Seu pedido foi processado com sucesso. Você receberá uma confirmação por email em breve.
          </p>
          
          {payment_id && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                ID do Pagamento: <span className="font-mono">{payment_id}</span>
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleViewOrders} className="w-full">
              <ShoppingBag className="w-4 h-4 mr-2" />
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

export default CheckoutSuccess;