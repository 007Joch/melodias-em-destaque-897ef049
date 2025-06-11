
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight, MapPin, CreditCard, Check, Copy } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import MercadoPagoService from "@/services/mercadoPagoService";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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
  is_default?: boolean;
}

type CheckoutStep = 'cart' | 'address' | 'payment' | 'processing' | 'success';

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estados do checkout
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados do formulário de endereço
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  
  // Estados do pagamento
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'pix'>('credit');
  const [pixData, setPixData] = useState<any>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  
  const estadosBrasileiros = [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
    "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
    "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
    "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
    "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
  ];

  // Resetar step quando o drawer fechar
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('cart');
      setShowAddForm(false);
      setPixData(null);
      setOrderId(null);
    }
  }, [isOpen]);

  // Carregar endereços quando necessário
  useEffect(() => {
    if (currentStep === 'address' && user) {
      loadAddresses();
    }
  }, [currentStep, user]);

  const loadAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      
      setAddresses(data || []);
      
      const defaultAddress = data?.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (data && data.length > 0) {
        setSelectedAddressId(data[0].id);
      }
      
      if (!data || data.length === 0) {
        setShowAddForm(true);
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar endereços",
        variant: "destructive",
      });
    }
  };

  const handleStartCheckout = () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para finalizar sua compra",
        variant: "destructive",
      });
      navigate("/login");
      onClose();
      return;
    }
    
    if (items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de finalizar",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep('address');
  };

  const validateAddressForm = () => {
    return rua.trim() !== "" && numero.trim() !== "" && bairro.trim() !== "" && 
           cidade.trim() !== "" && estado.trim() !== "" && cep.trim() !== "";
  };

  const handleSaveAddress = async () => {
    if (!validateAddressForm()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newAddress = {
        user_id: user?.id,
        rua,
        numero,
        complemento: complemento || null,
        bairro,
        cidade,
        estado,
        cep,
        is_default: addresses.length === 0
      };

      const { data, error } = await supabase
        .from('addresses')
        .insert([newAddress])
        .select()
        .single();

      if (error) throw error;

      setAddresses(prev => [...prev, data]);
      setSelectedAddressId(data.id);
      setShowAddForm(false);
      resetAddressForm();
      
      toast({
        title: "Endereço salvo",
        description: "Endereço adicionado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar endereço",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetAddressForm = () => {
    setRua("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("");
    setCep("");
  };

  const handleContinueToPayment = () => {
    if (!selectedAddressId) {
      toast({
        title: "Selecione um endereço",
        description: "Selecione um endereço para continuar",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep('payment');
  };

  const handleCreatePixPayment = async () => {
    setPaymentProcessing(true);
    try {
      const paymentData = {
        amount: totalPrice,
        description: `Compra de ${totalItems} música${totalItems > 1 ? 's' : ''}`,
        payer_email: user?.email || '',
        items: items.map(item => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: item.price
        }))
      };

      const result = await MercadoPagoService.createPixPayment(paymentData);
      
      if (result.success) {
        setPixData(result);
        await createOrder(result.payment_id);
        setCurrentStep('processing');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      toast({
        title: "Erro no pagamento",
        description: "Erro ao gerar PIX. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const createOrder = async (paymentId: string) => {
    try {
      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
      
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id,
          payment_id: paymentId,
          total_amount: totalPrice,
          status: 'pending',
          address: selectedAddress,
          items: items
        }])
        .select()
        .single();

      if (error) throw error;
      setOrderId(data.id);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  };

  const copyPixCode = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      toast({
        title: "Código copiado",
        description: "Código PIX copiado para a área de transferência",
      });
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setCurrentStep('success');
    setTimeout(() => {
      onClose();
      navigate('/my-orders');
    }, 3000);
  };

  const renderCartContent = () => (
    <>
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Carrinho vazio</h3>
          <p className="text-gray-500 mb-4">Adicione algumas músicas ao seu carrinho</p>
          <Button onClick={onClose} className="rounded-full">
            Continuar Navegando
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.artist}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="inline-block px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
                      {item.category}
                    </span>
                    <span className="font-medium text-primary">
                      R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-8 w-8 p-0 rounded-full"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 p-0 rounded-full"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div>
            <h3 className="font-medium text-gray-900 mb-3">Resumo do pedido</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <div className="space-y-3 pb-6">
            <Button
              variant="outline"
              onClick={clearCart}
              className="w-full rounded-full py-3 text-sm font-medium"
            >
              Limpar Carrinho
            </Button>
            
            <Button
              className="w-full bg-primary hover:bg-primary/90 rounded-full py-3 text-sm font-medium"
              onClick={handleStartCheckout}
            >
              Finalizar Pedido
            </Button>
          </div>
        </>
      )}
    </>
  );

  const renderAddressContent = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep('cart')}
          className="rounded-full p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h3 className="font-semibold">Endereço de Entrega</h3>
          <p className="text-sm text-gray-600">Selecione ou adicione um endereço</p>
        </div>
      </div>

      {/* Lista de endereços existentes */}
      {addresses.length > 0 && !showAddForm && (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedAddressId === address.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedAddressId(address.id!)}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id!)}
                  className="mt-1"
                />
                <div className="flex-1">
                  {address.is_default && (
                    <Badge variant="outline" className="mb-2 text-xs">Padrão</Badge>
                  )}
                  <p className="font-medium text-sm">
                    {address.rua}, {address.numero}
                    {address.complemento && `, ${address.complemento}`}
                  </p>
                  <p className="text-xs text-gray-600">
                    {address.bairro}, {address.cidade} - {address.estado}
                  </p>
                  <p className="text-xs text-gray-600">CEP: {address.cep}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botão para adicionar novo endereço */}
      {!showAddForm && (
        <Button
          variant="outline"
          onClick={() => setShowAddForm(true)}
          className="w-full rounded-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Novo Endereço
        </Button>
      )}

      {/* Formulário de novo endereço */}
      {showAddForm && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Novo Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rua" className="text-sm font-medium">Rua *</Label>
                <Input
                  id="rua"
                  placeholder="Nome da rua"
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                  className="rounded-lg text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero" className="text-sm font-medium">Número *</Label>
                <Input
                  id="numero"
                  placeholder="123"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento" className="text-sm font-medium">Complemento</Label>
              <Input
                id="complemento"
                placeholder="Apartamento, bloco, etc."
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                className="rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="bairro" className="text-sm font-medium">Bairro *</Label>
                <Input
                  id="bairro"
                  placeholder="Nome do bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="rounded-lg text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade" className="text-sm font-medium">Cidade *</Label>
                <Input
                  id="cidade"
                  placeholder="Nome da cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="estado" className="text-sm font-medium">Estado *</Label>
                <select
                  id="estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Selecione um estado</option>
                  {estadosBrasileiros.map((est) => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep" className="text-sm font-medium">CEP *</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  className="rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  resetAddressForm();
                }}
                className="flex-1 rounded-lg text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveAddress}
                disabled={loading}
                className="flex-1 rounded-lg text-sm"
              >
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão continuar */}
      {!showAddForm && addresses.length > 0 && (
        <Button
          onClick={handleContinueToPayment}
          disabled={!selectedAddressId}
          className="w-full rounded-full py-3"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Continuar para Pagamento
        </Button>
      )}
    </div>
  );

  const renderPaymentContent = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep('address')}
          className="rounded-full p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h3 className="font-semibold">Pagamento</h3>
          <p className="text-sm text-gray-600">Escolha sua forma de pagamento</p>
        </div>
      </div>

      <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="credit">Crédito</TabsTrigger>
          <TabsTrigger value="debit">Débito</TabsTrigger>
          <TabsTrigger value="pix">PIX</TabsTrigger>
        </TabsList>

        <TabsContent value="credit" className="space-y-4">
          <p className="text-sm text-gray-600">Pagamento com cartão de crédito</p>
          <Button 
            className="w-full rounded-full" 
            disabled={paymentProcessing}
            onClick={() => toast({ title: "Em desenvolvimento", description: "Pagamento com cartão será implementado em breve" })}
          >
            {paymentProcessing ? "Processando..." : "Pagar com Cartão de Crédito"}
          </Button>
        </TabsContent>

        <TabsContent value="debit" className="space-y-4">
          <p className="text-sm text-gray-600">Pagamento com cartão de débito</p>
          <Button 
            className="w-full rounded-full" 
            disabled={paymentProcessing}
            onClick={() => toast({ title: "Em desenvolvimento", description: "Pagamento com cartão será implementado em breve" })}
          >
            {paymentProcessing ? "Processando..." : "Pagar com Cartão de Débito"}
          </Button>
        </TabsContent>

        <TabsContent value="pix" className="space-y-4">
          <p className="text-sm text-gray-600">Pagamento instantâneo via PIX</p>
          <Button 
            className="w-full rounded-full" 
            disabled={paymentProcessing}
            onClick={handleCreatePixPayment}
          >
            {paymentProcessing ? "Gerando PIX..." : "Gerar PIX"}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Resumo do pedido */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-medium">Resumo do Pedido</h4>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.title} (x{item.quantity})</span>
                <span>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProcessingContent = () => (
    <div className="space-y-6 text-center">
      <div className="flex items-center gap-3 justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep('payment')}
          className="rounded-full p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold">Pagamento PIX</h3>
      </div>

      {pixData && (
        <div className="space-y-4">
          {pixData.qr_code_base64 && (
            <div className="flex justify-center">
              <img 
                src={`data:image/png;base64,${pixData.qr_code_base64}`}
                alt="QR Code PIX"
                className="w-48 h-48"
              />
            </div>
          )}
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Escaneie o QR Code acima ou copie o código PIX abaixo:
            </p>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs font-mono break-all text-gray-800">
                {pixData.qr_code}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={copyPixCode}
              className="w-full rounded-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Código PIX
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              Após realizar o pagamento, o pedido será processado automaticamente.
            </p>
          </div>

          <Button 
            variant="outline"
            onClick={handlePaymentSuccess}
            className="w-full rounded-full"
          >
            <Check className="w-4 h-4 mr-2" />
            Confirmar Pagamento (Demo)
          </Button>
        </div>
      )}
    </div>
  );

  const renderSuccessContent = () => (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-green-600" />
        </div>
      </div>
      
      <div>
        <h3 className="font-bold text-lg mb-2">Pedido Realizado!</h3>
        <p className="text-gray-600">
          Seu pedido foi processado com sucesso. Redirecionando para seus pedidos...
        </p>
      </div>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 'cart':
        return renderCartContent();
      case 'address':
        return renderAddressContent();
      case 'payment':
        return renderPaymentContent();
      case 'processing':
        return renderProcessingContent();
      case 'success':
        return renderSuccessContent();
      default:
        return renderCartContent();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'cart':
        return `Carrinho (${totalItems} ${totalItems === 1 ? 'item' : 'itens'})`;
      case 'address':
        return 'Endereço de Entrega';
      case 'payment':
        return 'Pagamento';
      case 'processing':
        return 'Processando Pagamento';
      case 'success':
        return 'Pedido Finalizado';
      default:
        return 'Carrinho';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            {getStepTitle()}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          {getStepContent()}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
