
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, ShoppingBag } from "lucide-react";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentId, setPaymentId] = useState<string>("");

  useEffect(() => {
    const id = location.state?.paymentId;
    if (id) {
      setPaymentId(id);
    } else {
      // Se não tem ID do pagamento, redirecionar para home
      setTimeout(() => navigate("/"), 3000);
    }
  }, [location.state, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-600 mb-2">
                Pagamento Aprovado!
              </CardTitle>
              <p className="text-gray-600">
                Seu pedido foi processado com sucesso e você receberá um e-mail de confirmação em breve.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {paymentId && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">ID do Pagamento:</p>
                  <p className="font-mono text-sm font-medium">{paymentId}</p>
                </div>
              )}
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Próximos passos:</h3>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• Você receberá um e-mail com os detalhes do pedido</li>
                  <li>• Os arquivos musicais serão disponibilizados em sua conta</li>
                  <li>• Em caso de dúvidas, entre em contato conosco</li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={() => navigate("/")}
                  className="flex-1 rounded-full"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  className="flex-1 rounded-full"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continuar Comprando
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                Obrigado por escolher Musical em Bom Português!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
