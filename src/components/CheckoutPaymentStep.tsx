
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
import { createPurchase, updatePurchaseStatus } from '@/services/purchaseService';
import type { InstallmentOption } from '@/services/mercadoPagoService';
import MercadoPagoService from '@/services/mercadoPagoService';
// Declarações de tipos para MercadoPago
// A declaração global do MercadoPago já existe em CardPaymentForm.tsx

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
  
  // Estados de BIN/payment method
  const [bin, setBin] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  
  // Estados de parcelas (sem BIN)
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  
  // PIX states
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null);
  
  // Coupon states
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponLoading, setCouponLoading] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<null | {
    code: string;
    discount_percent: number;
    expires_at: string | null;
    usage_limit: number | null;
    usage_count: number | null;
  }>(null);

  const { user } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const totalAmount = getTotalPrice();
  // Cálculo de desconto e total final com cupom aplicado
  const discountPercent = appliedCoupon?.discount_percent ?? 0;
  const discountAmount = discountPercent > 0 ? (totalAmount * discountPercent) / 100 : 0;
  const finalTotal = Math.max(0, totalAmount - discountAmount);

  // Capturar BIN quando o número do cartão mudar
  useEffect(() => {
    const digits = (cardNumber || '').replace(/\D/g, '');
    const newBin = digits.slice(0, 6);
    if (newBin !== bin) {
      setBin(newBin);
      console.log('[CheckoutPaymentStep] BIN atualizado:', newBin);
    }
  }, [cardNumber, bin]);
  
  // Detectar payment_method_id via SDK quando BIN mudar
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (paymentMethod !== 'credit') { setPaymentMethodId(null); return; }
      if (!bin || bin.length < 6) { setPaymentMethodId(null); return; }
      try {
        console.log('[CheckoutPaymentStep] Detectando payment_method_id via SDK para BIN:', bin);
        const MercadoPagoService = (await import('@/services/mercadoPagoService')).default;
        const id = await MercadoPagoService.getPaymentMethodIdByBin(bin);
        if (!cancelled) setPaymentMethodId(id);
      } catch (e) {
        console.warn('[CheckoutPaymentStep] Falha ao detectar payment_method_id:', e);
        if (!cancelled) setPaymentMethodId(null);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [bin, paymentMethod]);
  
  // Buscar parcelas com amount + (payment_method_id ou BIN)
  useEffect(() => {
    let cancelled = false;
    const fetchInstallments = async () => {
      if (paymentMethod !== 'credit' || finalTotal <= 0) {
        setInstallmentOptions([]);
        return;
      }
      if ((!bin || bin.length < 6) && !paymentMethodId) {
        console.log('[CheckoutPaymentStep] Aguardando BIN/payment_method_id para buscar parcelas...');
        setInstallmentOptions([]);
        return;
      }
      try {
        setLoadingInstallments(true);
        
        // Debug detalhado do amount
        console.log('[CheckoutPaymentStep] === DEBUG DO AMOUNT ===');
        console.log('[CheckoutPaymentStep] totalAmount (original):', totalAmount);
        console.log('[CheckoutPaymentStep] discountAmount:', discountAmount);
        console.log('[CheckoutPaymentStep] finalTotal (calculado):', finalTotal);
        console.log('[CheckoutPaymentStep] typeof finalTotal:', typeof finalTotal);
        
        // Garantir que amount seja um número válido
        const amount = Number(finalTotal.toFixed(2));
        console.log('[CheckoutPaymentStep] amount (final para SDK):', amount);
        console.log('[CheckoutPaymentStep] typeof amount:', typeof amount);
        console.log('[CheckoutPaymentStep] isNaN(amount):', isNaN(amount));
        
        console.log('[CheckoutPaymentStep] Buscando parcelas com', { amount, bin, payment_method_id: paymentMethodId });
        const MercadoPagoService = (await import('@/services/mercadoPagoService')).default;
        const options = await MercadoPagoService.getInstallments({ 
          amount: amount, 
          payment_method_id: paymentMethodId || undefined, 
          bin: bin && bin.length >= 6 ? bin : undefined 
        });
        if (!cancelled) {
          setInstallmentOptions(options);
          const selectedExists = options.some(o => o.quantity === installments);
          if (!selectedExists && options.length > 0) {
            setInstallments(options[0].quantity);
          }
        }
      } catch (e) {
        console.error('[CheckoutPaymentStep] Erro ao buscar parcelas:', e);
        if (!cancelled) setInstallmentOptions([]);
      } finally {
        if (!cancelled) setLoadingInstallments(false);
      }
    };
    fetchInstallments();
    return () => { cancelled = true; };
  }, [paymentMethod, finalTotal, bin, paymentMethodId, installments]);

  useEffect(() => {
    // Carregar SDK do Mercado Pago usando o serviço
    loadMercadoPagoSDK();
  }, []);

  const loadMercadoPagoSDK = async () => {
    try {
      const MercadoPagoService = (await import('@/services/mercadoPagoService')).default;
      await MercadoPagoService.loadMercadoPagoSDK();
    } catch (error) {
      console.error('Erro ao carregar SDK do Mercado Pago:', error);
    }
  };

  // Resolver payment_method_id a partir do BIN (apenas crédito) - Removido
  // useEffect(() => {
  //   let cancelled = false;
  //   (async () => {
  //     try {
  //       setPaymentMethodId('');
  //       if (paymentMethod !== 'credit') return;
  //       if (!bin || bin.length < 6) return;
  //       const MercadoPagoService = (await import('@/services/mercadoPagoService')).default;
  //       const id = await MercadoPagoService.getPaymentMethodIdByBin(bin);
  //       if (!cancelled) setPaymentMethodId(id || '');
  //     } catch (e) {
  //       console.warn('Não foi possível identificar payment_method_id pelo BIN:', e);
  //       if (!cancelled) setPaymentMethodId('');
  //     }
  //   })();
  //   return () => { cancelled = true; };
  // }, [bin, paymentMethod]);

  // Buscar opções de parcelas com amount + bin + payment_method_id (apenas crédito) - Removido
  // useEffect(() => {
  //   let cancelled = false;
  //   (async () => {
  //     try {
  //       if (paymentMethod !== 'credit') return;
  //       if (!bin || bin.length < 6) { setInstallmentOptions([]); return; }
  //       setLoadingInstallments(true);
  //       const MercadoPagoService = (await import('@/services/mercadoPagoService')).default;
  //       const options = await MercadoPagoService.getInstallments({ amount: finalTotal, bin, payment_method_id: paymentMethodId || undefined });
  //       if (cancelled) return;
  //       setInstallmentOptions(options);
  //       const selectedExists = options.some(o => o.quantity === installments);
  //       if (!selectedExists && options.length > 0) {
  //         setInstallments(options[0].quantity);
  //       }
  //     } catch (e) {
  //       console.error('Erro ao buscar parcelas:', e);
  //       if (!cancelled) setInstallmentOptions([]);
  //     } finally {
  //       if (!cancelled) setLoadingInstallments(false);
  //     }
  //   })();
  //   return () => { cancelled = true; };
  // }, [finalTotal, bin, paymentMethodId, paymentMethod]);
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
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const MercadoPagoService = (await import('@/services/mercadoPagoService')).default;
      
      const paymentData = {
        amount: finalTotal,
        description: `Compra Musical em Bom Português - ${items.length} item(s)`,
        payer_email: user?.email || 'cliente@musical.com',
        items: items.map(item => ({
          id: item.id || '',
          title: item.title || 'Verso Musical',
          quantity: item.quantity,
          price: item.price
        }))
      };

      const result = await MercadoPagoService.createPixPayment(paymentData, user.id);
      
      if (result.success) {
        setPixData({
          qr_code: result.qr_code || '',
          qr_code_base64: result.qr_code_base64 || '',
          payment_id: result.payment_id || ''
        });
        setPixPaymentId(result.payment_id || '');
        
        // Iniciar polling para verificar status do pagamento
        if (result.payment_id) {
          startPaymentStatusPolling(result.payment_id);
        }
      } else {
        throw new Error(result.error || 'Erro ao criar pagamento PIX');
      }
      
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar PIX. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startPaymentStatusPolling = (paymentId: string) => {
    const interval = setInterval(async () => {
      try {
        const MercadoPagoService = (await import('@/services/mercadoPagoService')).default;
        const result = await MercadoPagoService.checkPaymentStatus(paymentId);
        
        if (!result.success) throw new Error(result.error);
        
        if (result.success && result.status === 'approved') {
          clearInterval(interval);
          handlePaymentSuccess(paymentId);
        } else if (result.status === 'rejected' || result.status === 'cancelled') {
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

  // Incrementa usage_count do cupom no Supabase após compra aprovada
  const incrementCouponUsage = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('id, usage_count')
        .eq('code', code)
        .maybeSingle();

      if (error || !data) {
        console.warn('[Coupons] Cupom não encontrado para incremento:', code, error);
        return;
      }

      const current = Number(data.usage_count ?? 0);
      const { error: updateError } = await supabase
        .from('coupons')
        .update({ usage_count: current + 1 })
        .eq('id', data.id);

      if (updateError) {
        console.warn('[Coupons] Falha ao incrementar uso do cupom:', updateError);
      } else {
        console.log(`[Coupons] Uso do cupom ${code} incrementado para`, current + 1);
      }
    } catch (e) {
      console.warn('[Coupons] Erro inesperado ao incrementar uso do cupom:', e);
    }
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
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const MercadoPagoService = (await import('@/services/mercadoPagoService')).default;
      
      // Criar token do cartão usando o serviço
      const cardData = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName: cardName,
        cardExpirationMonth: expiryDate.split('/')[0],
        cardExpirationYear: `20${expiryDate.split('/')[1]}`,
        securityCode: cvv,
        identificationType: identificationType,
        identificationNumber: identificationNumber.replace(/\D/g, '')
      };

      console.log('🔍 Criando token do cartão...');
      const token = await MercadoPagoService.createCardToken(cardData);

      if (!token) {
        throw new Error('Erro ao processar dados do cartão');
      }
      
      const cardFormData = {
        token: token.id,
        // Não enviar payment_method_id para evitar erro diff_param_bins
        installments: installments,
        cardholderName: cardName,
        identificationType: identificationType,
        identificationNumber: identificationNumber.replace(/\D/g, '')
      };
      
      const paymentData = {
        amount: finalTotal,
        description: `Compra Musical em Bom Português - ${items.length} item(s)`,
        payer_email: user?.email || 'cliente@musical.com',
        items: items.map(item => ({
          id: item.id || '',
          title: item.title || 'Verso Musical',
          quantity: item.quantity,
          price: item.price
        })),
        coupon: appliedCoupon
          ? {
              code: appliedCoupon.code,
              discount_percent: appliedCoupon.discount_percent,
              discount_amount: discountAmount,
              original_total: totalAmount,
              final_total: finalTotal,
            }
          : undefined,
      };

      console.log('💰 Processando pagamento...');
      const result = await MercadoPagoService.createCardPayment(cardFormData, paymentData, user.id);

      if (result.success) {
        if (result.status === 'approved') {
          console.log('🎉 Pagamento aprovado!');
          handlePaymentSuccess(result.payment_id || '');
        } else if (result.status === 'rejected') {
          toast({
            title: "Pagamento rejeitado",
            description: `Motivo: ${result.status_detail || 'Verifique os dados do cartão'}`,
            variant: "destructive",
          });
        } else {
          // Para pagamentos em processamento (pending, in_process, etc.), iniciar polling
          console.log('⏳ Pagamento em processamento, iniciando polling...');
          toast({
            title: "Pagamento em processamento",
            description: "O pagamento está sendo processado. Aguarde a confirmação.",
            variant: "default",
          });
          
          // Iniciar polling de status para pagamentos em processamento
          if (result.payment_id) {
            startPaymentStatusPolling(result.payment_id);
          }
        }
      } else {
        toast({
          title: "Pagamento não processado",
          description: result.error || "Verifique os dados do cartão e tente novamente",
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
        total_amount: finalTotal,
        status: 'paid',
        address: address,
        items: items,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .insert([orderData]);

      if (error) throw error;

      // Registrar compras individuais para cada verso
      if (user?.id) {
        const purchaseItems = items.map(item => ({
          verse_id: parseInt(item.id), // Converter string para number
          amount: item.price * item.quantity
        }));

        // Itens do carrinho com metadados do cupom (se aplicado)
        const itemsWithCoupon = items.map(item => ({
          ...item,
          coupon: appliedCoupon
            ? {
                code: appliedCoupon.code,
                discount_percent: appliedCoupon.discount_percent,
                discount_amount: discountAmount,
                original_total: totalAmount,
                final_total: finalTotal,
              }
            : undefined,
        }));

        await createPurchase(
          user.id,
          purchaseItems,
          paymentMethod === 'pix' ? 'pix' : 'credit_card',
          paymentId,
          itemsWithCoupon // Passar dados do carrinho com metadados de cupom
        );

        // Atualizar status das compras para 'completed'
        await updatePurchaseStatus(paymentId, 'completed');
      }

      // Incrementar uso do cupom (se aplicado)
      if (appliedCoupon?.code) {
        await incrementCouponUsage(appliedCoupon.code);
      }

      console.log('🎉 [CheckoutPaymentStep] Pagamento processado com sucesso, chamando onSuccess com paymentId:', paymentId);
      
      toast({
        title: "Pagamento aprovado!",
        description: "Seu pedido foi processado com sucesso",
      });
      
      console.log('📞 [CheckoutPaymentStep] Chamando onSuccess...');
      onSuccess(paymentId);
      console.log('✅ [CheckoutPaymentStep] onSuccess chamado com sucesso');
      
      // Limpar carrinho após chamar onSuccess
      console.log('🧹 [CheckoutPaymentStep] Limpando carrinho...');
      clearCart();
      console.log('✅ [CheckoutPaymentStep] Carrinho limpo');
      
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

  // Validação e aplicação de cupom
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast({ title: 'Cupom inválido', description: 'Informe um código de cupom.', variant: 'destructive' });
      return;
    }
    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('code, discount_percent, expires_at, enabled, usage_limit, usage_count')
        .ilike('code', code)
        .eq('enabled', true)
        .maybeSingle();

      if (error || !data) {
        throw new Error('Cupom não encontrado ou indisponível.');
      }

      // Expiração (comparação por DATA no fuso de Brasília)
      if (data.expires_at) {
        const tz = 'America/Sao_Paulo';
        const toDateKey = (d: Date) =>
          new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
        const expiresKey = toDateKey(new Date(data.expires_at));
        const todayKey = toDateKey(new Date());
        if (expiresKey < todayKey) {
          throw new Error('Este cupom está expirado.');
        }
      }

      // Limite de uso
      if (typeof data.usage_limit === 'number' && typeof data.usage_count === 'number') {
        if (data.usage_limit > 0 && data.usage_count >= data.usage_limit) {
          throw new Error('Limite de uso deste cupom foi atingido.');
        }
      }

      // Percentual válido
      if (typeof data.discount_percent !== 'number' || data.discount_percent <= 0) {
        throw new Error('Este cupom não possui desconto válido.');
      }

      setAppliedCoupon({
        code: data.code,
        discount_percent: data.discount_percent,
        expires_at: data.expires_at || null,
        usage_limit: data.usage_limit ?? null,
        usage_count: data.usage_count ?? null,
      });
      setCouponCode(code);

      toast({
        title: 'Cupom aplicado',
        description: `Cupom ${code} aplicado com ${data.discount_percent}% de desconto.`,
        variant: 'default'
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível aplicar o cupom.';
      toast({ title: 'Cupom inválido', description: msg, variant: 'destructive' });
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast({ title: 'Cupom removido', description: 'O cupom foi removido.', variant: 'default' });
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
        <p className="text-sm font-medium mb-1">Endereço de Cobrança:</p>
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
              <div className="text-[10px] text-gray-500">BIN: {bin || '—'} | payment_method_id: {paymentMethodId || '—'}</div>
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
            
            {/* Seletor de Parcelas - Crédito */}
            <div className="space-y-1">
              <Label className="text-sm">Parcelas</Label>
              {loadingInstallments && (
                <div className="text-xs text-gray-500">Calculando parcelas...</div>
              )}
              {!loadingInstallments && installmentOptions.length === 0 && (
                <div className="text-xs text-gray-500">Digite um cartão válido para ver as opções de parcelamento.</div>
              )}
              {!loadingInstallments && installmentOptions.length > 0 && (
                <select
                  id="form-checkout__installments"
                  className="w-full border rounded-lg p-2 text-sm"
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value))}
                >
                  {installmentOptions.map((opt) => {
                    const baseTotal = (opt.amount ?? 0) * (opt.quantity ?? 0);
                    const total = typeof opt.total === 'number' ? opt.total : baseTotal;
                    const hasInterest = total > baseTotal + 0.009;
                    const rateLabel = (opt.rate && opt.rate > 0)
                      ? `(juros de ${Number(opt.rate).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%)`
                      : (hasInterest ? '(com juros)' : '(sem juros)');
                    return (
                      <option key={opt.quantity} value={opt.quantity}>
                        {`${opt.quantity}x de ${(opt.amount ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ${rateLabel}`}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                💳 Pagamento parcelado no crédito
              </p>
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
            
            {/* Seletor de Parcelas */}
            <div className="space-y-1">
              <Label className="text-sm">Parcelas</Label>
              {loadingInstallments && (
                <div className="text-xs text-gray-500">Calculando parcelas...</div>
              )}
              {!loadingInstallments && installmentOptions.length === 0 && (
                <div className="text-xs text-gray-500">Digite um cartão válido para ver as opções de parcelamento.</div>
              )}
              {!loadingInstallments && installmentOptions.length > 0 && (
                <select
                  id="form-checkout__installments"
                  className="w-full border rounded-lg p-2 text-sm"
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value))}
                >
                  {installmentOptions.map((opt) => {
                    const baseTotal = (opt.amount ?? 0) * (opt.quantity ?? 0);
                    const total = typeof opt.total === 'number' ? opt.total : baseTotal;
                    const hasInterest = total > baseTotal + 0.009;
                    const rateLabel = (opt.rate && opt.rate > 0)
                      ? `(juros de ${Number(opt.rate).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%)`
                      : (hasInterest ? '(com juros)' : '(sem juros)');
                    return (
                      <option key={opt.quantity} value={opt.quantity}>
                        {`${opt.quantity}x de ${(opt.amount ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ${rateLabel}`}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                💳 Pagamento parcelado no crédito
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
        {/* Cupom */}
        <div className="mb-4 space-y-2">
          <Label className="text-sm">Cupom de desconto</Label>
          {appliedCoupon ? (
            <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
              <div className="text-sm text-green-800">
                Aplicado: <span className="font-semibold">{appliedCoupon.code}</span> (-{appliedCoupon.discount_percent}%)
              </div>
              <Button variant="outline" size="sm" onClick={handleRemoveCoupon}>
                Remover
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Digite seu cupom"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="text-sm"
              />
              <Button onClick={handleApplyCoupon} disabled={couponLoading}>
                {couponLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  'Aplicar'
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="font-bold">Total:</span>
          <span className="font-bold text-lg text-primary">
            R$ {finalTotal.toFixed(2).replace('.', ',')}
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
              `Pagar R$ ${finalTotal.toFixed(2).replace('.', ',')}`
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CheckoutPaymentStep;
