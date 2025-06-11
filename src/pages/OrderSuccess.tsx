import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, Download, Music } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Order {
  id: string;
  payment_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: Array<{
    id: string;
    title: string;
    artist: string;
    quantity: number;
    price: number;
  }>;
}

const OrderSuccess = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const paymentId = location.state?.paymentId;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (!paymentId) {
      navigate("/");
      toast({
        title: "Erro",
        description: "Informações do pedido não encontradas",
        variant: "destructive",
      });
      return;
    }
    
    loadOrder();
  }, [user, paymentId, navigate]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_id', paymentId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      setOrder(data);
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar informações do pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações do pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido não encontrado</h1>
          <Button onClick={() => navigate("/")} className="rounded-full">
            <Home className="w-4 h-4 mr-2" />
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header de sucesso */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pagamento Aprovado!
            </h1>
            <p className="text-gray-600">
              Seu pedido foi processado com sucesso
            </p>
          </div>

          {/* Informações do pedido */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Detalhes do Pedido
              </CardTitle>
              <CardDescription>
                Pedido realizado em {formatDate(order.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">ID do Pedido:</span>
                  <p className="font-medium">{order.id}</p>
                </div>
                <div>
                  <span className="text-gray-600">ID do Pagamento:</span>
                  <p className="font-medium">{order.payment_id}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Itens Comprados:</h4>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.artist}</p>
                        <p className="text-xs text-gray-500">Quantidade: {item.quantity}</p>
                      </div>
                      <span className="font-medium">
                        R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                <span>Total Pago:</span>
                <span className="text-primary">
                  R$ {order.total_amount.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Próximos passos */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium">Confirmação por Email</p>
                    <p className="text-gray-600">
                      Você receberá um email de confirmação com os detalhes da compra
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium">Download dos Arquivos</p>
                    <p className="text-gray-600">
                      Os links para download estarão disponíveis em sua conta
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium">Suporte</p>
                    <p className="text-gray-600">
                      Em caso de dúvidas, entre em contato conosco
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="flex-1 rounded-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
            
            <Button
              onClick={() => navigate("/minha-conta")}
              className="flex-1 rounded-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Minha Conta
            </Button>
          </div>
          
          {/* Mensagem de agradecimento */}
          <div className="text-center mt-8 p-6 bg-white/50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">
              Obrigado pela sua compra! 🎵
            </h3>
            <p className="text-sm text-gray-600">
              Esperamos que você aproveite sua música em bom português!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;