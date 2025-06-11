
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Package, CreditCard, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Order {
  id: string;
  payment_id: string;
  total_amount: number;
  status: string;
  address: any;
  items: any[];
  created_at: string;
  updated_at: string;
}

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setOrders(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Meus Pedidos</h1>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-600 mb-4">Você ainda não fez nenhuma compra.</p>
            <Button onClick={() => window.location.href = '/'}>
              Explorar Músicas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Pedido #{order.payment_id}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        <span>Data: {formatDate(order.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>Total: R$ {order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">
                        Itens: {order.items.length} música{order.items.length !== 1 ? 's' : ''}
                      </p>
                      <div className="mt-1">
                        {order.items.slice(0, 2).map((item: any, index: number) => (
                          <span key={index} className="text-sm text-gray-600">
                            {item.title}
                            {index < Math.min(order.items.length - 1, 1) && ', '}
                          </span>
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-sm text-gray-600">
                            {' '}e mais {order.items.length - 2} música{order.items.length - 2 !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Pedido #{selectedOrder?.payment_id}</DialogTitle>
                        </DialogHeader>
                        {selectedOrder && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong>Status:</strong> {getStatusBadge(selectedOrder.status)}
                              </div>
                              <div>
                                <strong>Total:</strong> R$ {selectedOrder.total_amount.toFixed(2)}
                              </div>
                              <div>
                                <strong>Data:</strong> {formatDate(selectedOrder.created_at)}
                              </div>
                              <div>
                                <strong>ID Pagamento:</strong> {selectedOrder.payment_id}
                              </div>
                            </div>

                            <div>
                              <strong>Endereço de Entrega:</strong>
                              <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                                {selectedOrder.address.rua}, {selectedOrder.address.numero}
                                {selectedOrder.address.complemento && `, ${selectedOrder.address.complemento}`}
                                <br />
                                {selectedOrder.address.bairro}, {selectedOrder.address.cidade} - {selectedOrder.address.estado}
                                <br />
                                CEP: {selectedOrder.address.cep}
                              </div>
                            </div>

                            <div>
                              <strong>Itens do Pedido:</strong>
                              <div className="mt-2 space-y-2">
                                {selectedOrder.items.map((item: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                                    <div>
                                      <p className="font-medium">{item.title}</p>
                                      <p className="text-sm text-gray-600">{item.musical}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">R$ {item.price.toFixed(2)}</p>
                                      <p className="text-sm text-gray-600">Qtd: {item.quantity}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {order.status === 'completed' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Download className="w-4 h-4 mr-2" />
                        Downloads
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
