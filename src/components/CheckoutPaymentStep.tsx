
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Smartphone, Copy, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  payment_id: string;
}

interface CheckoutPaymentStepProps {
  address: Address;
  onBack: () => void;
  onSuccess: (paymentId: string) => void;
}

const CheckoutPaymentStep = ({ address, onBack, onSuccess }: CheckoutPaymentStepProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'pix'>('credit');
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Card form states
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [installments, setInstallments] = useState(1);
  const [identificationType, setIdentificationType] = useState("CPF");
  const [identificationNumber, setIdentificationNumber] = useState("");
  
  // PIX states
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const totalAmount = getTotalPrice();

  useEffect(() => {
    // Carregar SDK do Mercado Pago
    loadMercadoPagoSDK();
  }, []);

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

  const formatCPF = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 11) {
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const createPixPayment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-payment', {
        body: {
          method: 'CREATE_PIX_PAYMENT',
          amount: totalAmount,
          description: `Compra Musical em Bom Português - ${items.length} item(s)`,
          payer_email: user?.email,
          user_id: user?.id,
          items: items.map(item => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            price: item.price
          }))
        }
      });

      if (error) throw error;

      if (data.success) {
        setPixData({
          qr_code: data.qr_code,
          qr_code_base64: data.qr_code_base64,
          payment_id: data.payment_id
        });
        setPixPaymentId(data.payment_id);
        
        // Iniciar polling para verificar status do pagamento
        startPaymentStatusPolling(data.payment_id);
      } else {
        throw new Error(data.error || 'Erro ao criar pagamento PIX');
      }
      
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
        const { data, error } = await supabase.functions.invoke('mercadopago-payment', {
          body: {
            method: 'CHECK_PAYMENT_STATUS',
            payment_id: paymentId
          }
        });
        
        if (error) throw error;
        
        if (data.success && data.status === 'approved') {
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
    if (!cardNumber || !cardName || !expiryDate || !cvv || !identificationNumber) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os dados do cartão",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(true);
    try {
      // Criar token do cartão usando MercadoPago SDK
      const cardData = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        securityCode: cvv,
        expirationMonth: expiryDate.split('/')[0],
        expirationYear: `20${expiryDate.split('/')[1]}`,
        cardholderName: cardName,
      };

      const token = await window.MercadoPago.createCardToken(cardData);
      
      if (token.error) {
        throw new Error(token.error.message || 'Erro ao processar dados do cartão');
      }

      const { data, error } = await supabase.functions.invoke('mercadopago-payment', {
        body: {
          method: 'CREATE_CARD_PAYMENT',
          amount: totalAmount,
          description: `Compra Musical em Bom Português - ${items.length} item(s)`,
          payer_email: user?.email,
          user_id: user?.id,
          items: items.map(item => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            price: item.price
          })),
          token: token.id,
          payment_method_id: paymentMethod === 'credit' ? 'visa' : 'debvisa',
          installments: paymentMethod === 'credit' ? installments : 1,
          cardholder_name: cardName,
          identification_type: identificationType,
          identification_number: identificationNumber.replace(/\D/g, '')
        }
      });

      if (error) throw error;

      if (data.success && data.status === 'approved') {
        handlePaymentSuccess(data.payment_id);
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
        description: error instanceof Error ? error.message : "Erro ao processar pagamento. Tente novamente.",
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

      // Limpar carrinho
      clearCart();
      
      toast({
        title: "Pagamento aprovado!",
        description: "Seu pedido foi processado com sucesso",
      });
      
      onSuccess(paymentId);
      
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-2 h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h3 className="font-semibold text-lg">Pagamento</h3>
          <p className="text-sm text-gray-600">Escolha a forma de pagamento</p>
        </div>
      </div>

      {/* Endereço selecionado */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium mb-1">Endereço de Entrega:</p>
        <p className="text-sm text-gray-600">
          {address.rua}, {address.numero}
          {address.complemento && `, ${address.complemento}`} - {address.bairro}, {address.cidade}/{address.estado}
        </p>
      </div>

      {/* Formas de pagamento */}
      <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="credit" className="text-xs">
            <CreditCard className="w-3 h-3 mr-1" />
            Crédito
          </TabsTrigger>
          <TabsTrigger value="debit" className="text-xs">
            <CreditCard className="w-3 h-3 mr-1" />
            Débito
          </TabsTrigger>
          <TabsTrigger value="pix" className="text-xs">
            <Smartphone className="w-3 h-3 mr-1" />
            PIX
          </TabsTrigger>
        </TabsList>
        
        {/* Cartão de Crédito/Débito */}
        <TabsContent value="credit" className="space-y-3 mt-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cardNumber" className="text-sm">Número do Cartão</Label>
              <Input
                id="cardNumber"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="cardName" className="text-sm">Nome no Cartão</Label>
              <Input
                id="cardName"
                placeholder="Nome como está no cartão"
                value={cardName}
                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                className="text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="expiryDate" className="text-sm">Validade</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/AA"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  maxLength={5}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="cvv" className="text-sm">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="000"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  maxLength={4}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="identification" className="text-sm">CPF</Label>
              <Input
                id="identification"
                placeholder="000.000.000-00"
                value={identificationNumber}
                onChange={(e) => setIdentificationNumber(formatCPF(e.target.value))}
                maxLength={14}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="installments" className="text-sm">Parcelas</Label>
              <select
                id="installments"
                value={installments}
                onChange={(e) => setInstallments(parseInt(e.target.value))}
                className="w-full p-2 border rounded text-sm"
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
        
        <TabsContent value="debit" className="space-y-3 mt-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cardNumber" className="text-sm">Número do Cartão</Label>
              <Input
                id="cardNumber"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="cardName" className="text-sm">Nome no Cartão</Label>
              <Input
                id="cardName"
                placeholder="Nome como está no cartão"
                value={cardName}
                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                className="text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="expiryDate" className="text-sm">Validade</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/AA"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  maxLength={5}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="cvv" className="text-sm">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="000"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  maxLength={4}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="identification" className="text-sm">CPF</Label>
              <Input
                id="identification"
                placeholder="000.000.000-00"
                value={identificationNumber}
                onChange={(e) => setIdentificationNumber(formatCPF(e.target.value))}
                maxLength={14}
                className="text-sm"
              />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                💳 Pagamento à vista no débito
              </p>
            </div>
          </div>
        </TabsContent>
        
        {/* PIX */}
        <TabsContent value="pix" className="space-y-4 mt-4">
          {!pixData ? (
            <div className="text-center py-6">
              <Smartphone className="w-12 h-12 text-primary mx-auto mb-3" />
              <h4 className="font-medium mb-2">Pagamento via PIX</h4>
              <p className="text-sm text-gray-600 mb-4">
                Clique no botão abaixo para gerar o código PIX
              </p>
              <Button
                onClick={createPixPayment}
                disabled={loading}
                className="w-full"
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
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-medium mb-2">PIX Gerado!</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Escaneie o QR Code ou copie o código abaixo
                </p>
              </div>
              
              {/* QR Code */}
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${pixData.qr_code_base64}`}
                  alt="QR Code PIX"
                  className="w-32 h-32 border rounded-lg"
                />
              </div>
              
              {/* Código PIX */}
              <div className="space-y-2">
                <Label className="text-sm">Código PIX (Copia e Cola)</Label>
                <div className="flex gap-2">
                  <Input
                    value={pixData.qr_code}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button
                    onClick={copyPixCode}
                    variant="outline"
                    size="sm"
                    className="px-3"
                  >
                    {pixCopied ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  ⏱️ Aguardando pagamento... O status será atualizado automaticamente.
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Total e botão de pagamento */}
      <div className="pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold">Total:</span>
          <span className="font-bold text-lg text-primary">
            R$ {totalAmount.toFixed(2).replace('.', ',')}
          </span>
        </div>
        
        {paymentMethod !== 'pix' && (
          <Button
            onClick={processCardPayment}
            disabled={processingPayment}
            className="w-full"
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
      </div>
    </div>
  );
};

export default CheckoutPaymentStep;
