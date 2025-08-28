import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from "@/integrations/supabase/client";
import { useMultiTenant } from '@/context/MultiTenantContext';
import { useAuth } from '@/context/AuthContext';
import { useSubdomain } from '@/hooks/useSubdomain';

interface Address {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
}

const DeliveryAddressForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [address, setAddress] = useState<Address>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'delivery'>('online');
  const [onlinePaymentType, setOnlinePaymentType] = useState<'credit_card' | 'pix'>('credit_card');
  const [deliveryPaymentType, setDeliveryPaymentType] = useState<'card' | 'cash'>('card');
  const [changeAmount, setChangeAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mercadoPagoLoaded, setMercadoPagoLoaded] = useState(false);
  
  const { cartItems, clearCart, getCartTotal } = useCart();
  const { currentTeam } = useMultiTenant();
  const { user } = useAuth();
  const { subdomain, isAdminMode } = useSubdomain();

  const deliveryFee = 5.00;
  const total = getCartTotal() + deliveryFee;

  // Carregar script do Mercado Pago
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      setMercadoPagoLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Buscar endereço pelo CEP
  const handleZipcodeChange = async (zipcode: string) => {
    setAddress(prev => ({ ...prev, zipcode }));
    
    if (zipcode.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${zipcode}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setAddress(prev => ({
            ...prev,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const validateAddress = () => {
    const required = ['street', 'number', 'neighborhood', 'city', 'state', 'zipcode'];
    return required.every(field => address[field as keyof Address].trim() !== '');
  };

  const handleNextStep = () => {
    if (!validateAddress()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios do endereço.",
        variant: "destructive",
      });
      return;
    }
    setStep('payment');
  };

  const createOrder = async () => {
    try {
      // Determinar team_id baseado no subdomínio
      let teamId = null;
      
      if (!isAdminMode && currentTeam?.id) {
        teamId = currentTeam.id;
        console.log('Usando team_id do subdomínio:', teamId);
        
        // Configurar o current_setting no Supabase para RLS
        const { error: settingError } = await supabase.rpc('set_current_team_id', {
          team_id: teamId.toString()
        });
        
        if (settingError) {
          console.warn('Erro ao configurar team_id no Supabase:', settingError);
        }
      } else {
        console.log('Modo admin ou sem team - permitindo pedido sem team_id');
      }
      
      // Preparar payload do pedido
      const orderPayload: any = {
        total,
        delivery_type: 'delivery',
        delivery_address: address,
        status: 'pending',
        payment_method: paymentMethod === 'online' ? 
          (onlinePaymentType === 'credit_card' ? 'mercado_pago' : 'pix') : 
          (deliveryPaymentType === 'card' ? 'credit_card' : 'cash'),
        payment_status: paymentMethod === 'online' ? 'pending' : 'pending',
        restaurant_id: 1
      };

      // Adicionar team_id apenas se determinado
      if (teamId) {
        orderPayload.team_id = teamId;
      }

      // Adicionar user_id apenas se usuário estiver logado
      if (user?.id) {
        orderPayload.user_id = user.id;
      }

      console.log('Criando pedido com payload:', orderPayload);

      // Criar o pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();

      if (orderError) {
        console.error('Erro ao criar pedido:', orderError);
        throw new Error('Não foi possível criar o pedido');
      }

      console.log('Pedido criado com sucesso:', order);

      // Preparar itens do pedido
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        team_id: teamId
      }));

      console.log('Criando itens do pedido:', orderItems);

      // Criar os itens do pedido
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Erro ao criar itens do pedido:', itemsError);
        throw new Error('Não foi possível criar os itens do pedido');
      }

      console.log('Itens do pedido criados com sucesso');

      return order;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  };

  const handleOnlinePayment = async () => {
    if (!mercadoPagoLoaded) {
      toast({
        title: "Erro",
        description: "Sistema de pagamento ainda carregando. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await createOrder();
      
      // Aqui você integraria com o Mercado Pago
      // Por enquanto, simularemos o pagamento
      toast({
        title: "Pedido realizado!",
        description: "Seu pedido foi enviado e será entregue no endereço informado.",
      });

      clearCart();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar seu pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeliveryPayment = async () => {
    setIsSubmitting(true);

    try {
      const order = await createOrder();
      
      toast({
        title: "Pedido realizado!",
        description: "Seu pedido foi enviado e será entregue no endereço informado. O pagamento será feito na entrega.",
      });

      clearCart();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar seu pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'address') {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="zipcode">CEP *</Label>
            <Input
              id="zipcode"
              placeholder="00000-000"
              value={address.zipcode}
              onChange={(e) => handleZipcodeChange(e.target.value.replace(/\D/g, ''))}
              maxLength={8}
            />
          </div>

          <div>
            <Label htmlFor="street">Rua *</Label>
            <Input
              id="street"
              placeholder="Nome da rua"
              value={address.street}
              onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="number">Número *</Label>
              <Input
                id="number"
                placeholder="123"
                value={address.number}
                onChange={(e) => setAddress(prev => ({ ...prev, number: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                placeholder="Apto, bloco, etc."
                value={address.complement}
                onChange={(e) => setAddress(prev => ({ ...prev, complement: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="neighborhood">Bairro *</Label>
            <Input
              id="neighborhood"
              placeholder="Nome do bairro"
              value={address.neighborhood}
              onChange={(e) => setAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                placeholder="Nome da cidade"
                value={address.city}
                onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                placeholder="UF"
                value={address.state}
                onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                maxLength={2}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">R$ {getCartTotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Taxa de entrega</span>
            <span className="font-medium">R$ {deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-6">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-lg">R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <Button
          onClick={handleNextStep}
          className="w-full bg-menu-primary hover:bg-menu-primary/90"
        >
          Continuar para pagamento
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pt-4 border-t">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">R$ {getCartTotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Taxa de entrega</span>
          <span className="font-medium">R$ {deliveryFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-6">
          <span className="font-bold text-lg">Total</span>
          <span className="font-bold text-lg">R$ {total.toFixed(2)}</span>
        </div>
      </div>

      <Button
        onClick={() => setStep('address')}
        variant="outline"
        className="w-full mb-4"
      >
        Voltar para endereço
      </Button>

      <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'online' | 'delivery')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="online">Pagar agora</TabsTrigger>
          <TabsTrigger value="delivery">Pagar na entrega</TabsTrigger>
        </TabsList>
        
        <TabsContent value="online" className="space-y-4">
          <RadioGroup value={onlinePaymentType} onValueChange={(value) => setOnlinePaymentType(value as 'credit_card' | 'pix')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="credit_card" id="credit_card" />
              <Label htmlFor="credit_card">Cartão de Crédito/Débito</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pix" id="pix" />
              <Label htmlFor="pix">PIX</Label>
            </div>
          </RadioGroup>
          
          <div id="mercadopago-checkout"></div>
          
          <Button
            onClick={handleOnlinePayment}
            className="w-full bg-menu-primary hover:bg-menu-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processando..." : "Finalizar Pedido"}
          </Button>
        </TabsContent>
        
        <TabsContent value="delivery" className="space-y-4">
          <RadioGroup value={deliveryPaymentType} onValueChange={(value) => setDeliveryPaymentType(value as 'card' | 'cash')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="card" id="card_delivery" />
              <Label htmlFor="card_delivery">Cartão na entrega</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash">Dinheiro</Label>
            </div>
          </RadioGroup>
          
          {deliveryPaymentType === 'cash' && (
            <div>
              <Label htmlFor="change">Troco para quanto? (opcional)</Label>
              <Input
                id="change"
                placeholder="R$ 0,00"
                value={changeAmount}
                onChange={(e) => setChangeAmount(e.target.value)}
              />
            </div>
          )}
          
          <Button
            onClick={handleDeliveryPayment}
            className="w-full bg-menu-primary hover:bg-menu-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processando..." : "Finalizar Pedido"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveryAddressForm;