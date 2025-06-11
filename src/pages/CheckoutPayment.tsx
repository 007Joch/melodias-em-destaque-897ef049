import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Smartphone, Copy, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Declarações de tipos para MercadoPago
declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface Address {
  id?: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface PixPaymentData {
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string;
}

const CheckoutPayment = () => {
  const [address, setAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'pix'>('credit');
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Card form states
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [installments, setInstallments] = useState(1);
  
  // PIX states
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const totalAmount = getTotalPrice();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (items.length === 0) {
      navigate("/");
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de finalizar o pedido",
        variant: "destructive",
      });
      return;
    }
    
    // Carregar endereço do localStorage
    const savedAddress = localStorage.getItem('checkout_address');
    if (!savedAddress) {
      navigate('/checkout/address');
      toast({
        title: "Endereço necessário",
        description: "Selecione um endereço antes de continuar",
        variant: "destructive",
      });
      return;
    }
    
    setAddress(JSON.parse(savedAddress));
    
    // Carregar SDK do Mercado Pago
    loadMercadoPagoSDK();
  }, [user, items, navigate]);

  const loadMercadoPagoSDK = () => {
    if (window.MercadoPago) return;
    
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      window.MercadoPago = new window.MercadoPago('TEST-d72e3d17-e94f-4af6-a1e0-20b5be84c593');
    };
    document.head.appendChild(script);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const createPixPayment = async () => {
    setLoading(true);
    try {
      const paymentData = {
        transaction_amount: totalAmount,
        description: `Compra Musical em Bom Português - ${items.length} item(s)`,
        payment_method_id: 'pix',
        payer: {
          email: user?.email,
          first_name: user?.user_metadata?.name || 'Cliente',
        },
        metadata: {
          user_id: user?.id,
          items: items.map(item => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            price: item.price
          }))
        }
      };

      const response = await fetch('/api/mercadopago/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar pagamento PIX');
      }

      const data = await response.json();
      setPixData({
        qr_code: data.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
        ticket_url: data.point_of_interaction.transaction_data.ticket_url
      });
      setPixPaymentId(data.id);
      
      // Iniciar polling para verificar status do pagamento
      startPaymentStatusPolling(data.id);
      
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PIX. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startPaymentStatusPolling = (paymentId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/mercadopago/payment-status/${paymentId}`);
        const data = await response.json();
        
        if (data.status === 'approved') {
          clearInterval(interval);
          handlePaymentSuccess(paymentId);
        } else if (data.status === 'rejected' || data.status === 'cancelled') {
          clearInterval(interval);
          toast({
            title: "Pagamento não aprovado",
            description: "O pagamento foi rejeitado ou cancelado",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
      }
    }, 3000); // Verificar a cada 3 segundos
    
    // Parar polling após 10 minutos
    setTimeout(() => {
      clearInterval(interval);
    }, 600000);
  };

  const processCardPayment = async () => {
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os dados do cartão",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(true);
    try {
      const [month, year] = expiryDate.split('/');
      
      const paymentData = {
        transaction_amount: totalAmount,
        description: `Compra Musical em Bom Português - ${items.length} item(s)`,
        payment_method_id: paymentMethod === 'credit' ? 'visa' : 'debvisa', // Simplificado
        installments: installments,
        payer: {
          email: user?.email,
          first_name: user?.user_metadata?.name || 'Cliente',
        },
        card: {
          number: cardNumber.replace(/\s/g, ''),
          security_code: cvv,
          expiration_month: parseInt(month),
          expiration_year: parseInt(`20${year}`),
          cardholder: {
            name: cardName,
          }
        },
        metadata: {
          user_id: user?.id,
          items: items.map(item => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            price: item.price
          }))
        }
      };

      const response = await fetch('/api/mercadopago/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Erro ao processar pagamento');
      }

      const data = await response.json();
      
      if (data.status === 'approved') {
        handlePaymentSuccess(data.id);
      } else {
        toast({
          title: "Pagamento não aprovado",
          description: data.status_detail || "Verifique os dados do cartão e tente novamente",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      // Salvar pedido no banco de dados
      const orderData = {
        user_id: user?.id,
        payment_id: paymentId,
        total_amount: totalAmount,
        status: 'paid',
        address: address,
        items: items,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .insert([orderData]);

      if (error) throw error;

      // Limpar carrinho e localStorage
      clearCart();
      localStorage.removeItem('checkout_address');
      
      toast({
        title: "Pagamento aprovado!",
        description: "Seu pedido foi processado com sucesso",
      });
      
      navigate('/order-success', { state: { paymentId } });
      
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      toast({
        title: "Erro",
        description: "Pagamento aprovado, mas houve erro ao salvar o pedido. Entre em contato conosco.",
        variant: "destructive",
      });
    }
  };

  const copyPixCode = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      setPixCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole no seu app de pagamentos",
      });
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/checkout/address")}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pagamento</h1>
            <p className="text-gray-600">Escolha a forma de pagamento</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formas de pagamento */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Forma de Pagamento</CardTitle>
                <CardDescription>
                  Selecione como deseja pagar seu pedido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="credit" className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Crédito
                    </TabsTrigger>
                    <TabsTrigger value="debit" className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Débito
                    </TabsTrigger>
                    <TabsTrigger value="pix" className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      PIX
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Cartão de Crédito/Débito */}
                  <TabsContent value="credit" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Número do Cartão</Label>
                        <Input
                          id="cardNumber"
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          maxLength={19}
                          className="rounded-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Nome no Cartão</Label>
                        <Input
                          id="cardName"
                          placeholder="Nome como está no cartão"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          className="rounded-full"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate">Validade</Label>
                          <Input
                            id="expiryDate"
                            placeholder="MM/AA"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                            maxLength={5}
                            className="rounded-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="000"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                            maxLength={4}
                            className="rounded-full"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="installments">Parcelas</Label>
                        <select
                          id="installments"
                          value={installments}
                          onChange={(e) => setInstallments(parseInt(e.target.value))}
                          className="w-full p-3 border border-gray-200 rounded-full focus:border-primary focus:ring-primary/20"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                            <option key={num} value={num}>
                              {num}x de R$ {(totalAmount / num).toFixed(2).replace('.', ',')} 
                              {num === 1 ? ' à vista' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="debit" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Número do Cartão</Label>
                        <Input
                          id="cardNumber"
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          maxLength={19}
                          className="rounded-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Nome no Cartão</Label>
                        <Input
                          id="cardName"
                          placeholder="Nome como está no cartão"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          className="rounded-full"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate">Validade</Label>
                          <Input
                            id="expiryDate"
                            placeholder="MM/AA"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                            maxLength={5}
                            className="rounded-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="000"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                            maxLength={4}
                            className="rounded-full"
                          />
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          💳 Pagamento à vista no débito
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* PIX */}
                  <TabsContent value="pix" className="space-y-4 mt-6">
                    {!pixData ? (
                      <div className="text-center py-8">
                        <Smartphone className="w-16 h-16 text-primary mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Pagamento via PIX</h3>
                        <p className="text-gray-600 mb-6">
                          Clique no botão abaixo para gerar o código PIX
                        </p>
                        <Button
                          onClick={createPixPayment}
                          disabled={loading}
                          className="rounded-full px-8"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Gerando PIX...
                            </>
                          ) : (
                            'Gerar Código PIX'
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-2">PIX Gerado!</h3>
                          <p className="text-gray-600 mb-4">
                            Escaneie o QR Code ou copie o código abaixo
                          </p>
                        </div>
                        
                        {/* QR Code */}
                        <div className="flex justify-center">
                          <img
                            src={`data:image/png;base64,${pixData.qr_code_base64}`}
                            alt="QR Code PIX"
                            className="w-48 h-48 border rounded-lg"
                          />
                        </div>
                        
                        {/* Código PIX */}
                        <div className="space-y-2">
                          <Label>Código PIX (Copia e Cola)</Label>
                          <div className="flex gap-2">
                            <Input
                              value={pixData.qr_code}
                              readOnly
                              className="rounded-full font-mono text-xs"
                            />
                            <Button
                              onClick={copyPixCode}
                              variant="outline"
                              size="sm"
                              className="rounded-full px-4"
                            >
                              {pixCopied ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-green-800">
                            ⏱️ Aguardando pagamento... O status será atualizado automaticamente.
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do pedido */}
          <div className="lg:col-span-1 space-y-6">
            {/* Endereço de entrega */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Endereço de Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {address.rua}, {address.numero}
                    {address.complemento && `, ${address.complemento}`}
                  </p>
                  <p className="text-gray-600">
                    {address.bairro}, {address.cidade} - {address.estado}
                  </p>
                  <p className="text-gray-600">CEP: {address.cep}</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Resumo do pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        <p className="text-xs text-gray-600">{item.artist}</p>
                        <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                      </div>
                      <span className="font-medium text-sm">
                        R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">
                    R$ {totalAmount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                {paymentMethod !== 'pix' && (
                  <Button
                    onClick={processCardPayment}
                    disabled={processingPayment}
                    className="w-full rounded-full py-3 mt-6"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      `Pagar R$ ${totalAmount.toFixed(2).replace('.', ',')}`
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPayment;