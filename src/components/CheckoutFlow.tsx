import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Plus, CreditCard, QrCode, ChevronDown, Loader2, CheckCircle, Copy, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CardPaymentForm from './CardPaymentForm';

interface CheckoutFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

interface Address {
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

type CheckoutStep = 'address' | 'payment' | 'processing';
type PaymentMethod = 'credit' | 'debit' | 'pix';

const CheckoutFlow = ({ onBack, onComplete }: CheckoutFlowProps) => {
  const { user, profile } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string>('');
  const [pixCopyPaste, setPixCopyPaste] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  
  // Estados do formulário de endereço
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);
  const [filteredEstados, setFilteredEstados] = useState<string[]>([]);
  const estadoInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const estadosBrasileiros = [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
    "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
    "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
    "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
    "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
  ];

  const totalPrice = getTotalPrice();

  useEffect(() => {
    // Carregar endereço existente do usuário
    if (profile?.endereco) {
      setSelectedAddress(profile.endereco);
    }
  }, [profile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEstadoDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEstadoChange = (value: string) => {
    setEstado(value);
    const filtered = estadosBrasileiros.filter(estado =>
      estado.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredEstados(filtered);
    setShowEstadoDropdown(value.length > 0 && filtered.length > 0);
  };

  const selectEstado = (estadoSelecionado: string) => {
    setEstado(estadoSelecionado);
    setShowEstadoDropdown(false);
    setFilteredEstados([]);
  };

  const validateAddressForm = () => {
    return rua.trim() !== '' && numero.trim() !== '' && bairro.trim() !== '' && 
           cidade.trim() !== '' && estado.trim() !== '' && cep.trim() !== '';
  };

  const handleSaveAddress = async () => {
    if (!validateAddressForm()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios do endereço.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const newAddress: Address = {
        rua: rua.trim(),
        numero: numero.trim(),
        complemento: complemento.trim() || '',
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: estado.trim(),
        cep: cep.trim()
      };

      // Salvar endereço no perfil do usuário
      const { error } = await supabase
        .from('profiles')
        .update({ endereco: newAddress })
        .eq('id', user?.id);

      if (error) throw error;

      setSelectedAddress(newAddress);
      setShowAddressForm(false);
      
      // Limpar formulário
      setRua('');
      setNumero('');
      setComplemento('');
      setBairro('');
      setCidade('');
      setEstado('');
      setCep('');

      toast({
        title: "Sucesso",
        description: "Endereço salvo com sucesso!"
      });
    } catch (error: any) {
      console.error('Erro ao salvar endereço:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar endereço. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToPayment = () => {
    if (!selectedAddress) {
      toast({
        title: "Erro",
        description: "Por favor, selecione ou cadastre um endereço.",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep('payment');
  };

  const initializeMercadoPago = () => {
    return new Promise((resolve) => {
      if (window.MercadoPago) {
        resolve(window.MercadoPago);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = () => {
        window.MercadoPago.setPublishableKey('TEST-d72e3d17-e94f-4af6-a1e0-20b5be84c593');
        resolve(window.MercadoPago);
      };
      document.head.appendChild(script);
    });
  };

  const createPixPayment = async () => {
    setLoading(true);
    try {
      // Importar dinamicamente o serviço do Mercado Pago
      const MercadoPagoService = (await import('@/services/mercadoPagoService')).default;
      
      const paymentData = {
        amount: totalPrice,
        description: `Compra de ${items.length} verso(s) - Musical em Bom Português`,
        payer_email: user?.email || 'cliente@musical.com',
        items: items.map(item => ({
          title: item.title || 'Verso Musical',
          quantity: item.quantity,
          unit_price: item.price
        }))
      };

      const result = await MercadoPagoService.createPixPayment(paymentData);
      
      if (result.success) {
        setPixQrCode(result.qr_code_base64 || '');
        setPixCopyPaste(result.qr_code || '');
        setPaymentId(result.payment_id || '');
        
        // Iniciar polling para verificar pagamento
        if (result.payment_id) {
          startPaymentPolling(result.payment_id);
        }
      } else {
        throw new Error(result.error || 'Erro ao criar pagamento PIX');
      }
    } catch (error: any) {
      console.error('Erro ao criar PIX:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar PIX. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCardPayment = async () => {
    setLoading(true);
    try {
      await initializeMercadoPago();
      
      // Aqui você implementaria o formulário de cartão do Mercado Pago
      // Por simplicidade, vou simular um pagamento aprovado
      setTimeout(() => {
        handlePaymentSuccess();
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao processar cartão:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const startPaymentPolling = (paymentId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/check-payment-status/${paymentId}`);
        const data = await response.json();
        
        if (data.status === 'approved') {
          clearInterval(interval);
          handlePaymentSuccess();
        } else if (data.status === 'rejected' || data.status === 'cancelled') {
          clearInterval(interval);
          toast({
            title: "Pagamento não aprovado",
            description: "O pagamento foi rejeitado ou cancelado.",
            variant: "destructive"
          });
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
      }
    }, 3000);

    // Parar polling após 10 minutos
    setTimeout(() => {
      clearInterval(interval);
      if (loading) {
        toast({
          title: "Tempo esgotado",
          description: "O tempo para pagamento expirou. Tente novamente.",
          variant: "destructive"
        });
        setLoading(false);
      }
    }, 600000);
  };

  const handlePaymentSuccess = () => {
    setLoading(false);
    clearCart();
    toast({
      title: "Pagamento aprovado!",
      description: "Seu pedido foi processado com sucesso."
    });
    onComplete();
  };

  const handlePaymentError = (error: string) => {
    setLoading(false);
    toast({
      title: "Erro no pagamento",
      description: error,
      variant: "destructive"
    });
  };

  const handleProcessPayment = () => {
    setCurrentStep('processing');
    
    if (paymentMethod === 'pix') {
      createPixPayment();
    } else {
      createCardPayment();
    }
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCopyPaste);
    toast({
      title: "Copiado!",
      description: "Código PIX copiado para a área de transferência."
    });
  };

  if (currentStep === 'address') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-1">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold">Endereço de Entrega</h2>
        </div>

        {selectedAddress && !showAddressForm && (
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-4 h-4 text-primary" />
                Endereço Cadastrado
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-1 text-sm text-gray-600">
                <p>{selectedAddress.rua}, {selectedAddress.numero}</p>
                {selectedAddress.complemento && <p>{selectedAddress.complemento}</p>}
                <p>{selectedAddress.bairro} - {selectedAddress.cidade}/{selectedAddress.estado}</p>
                <p>CEP: {selectedAddress.cep}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <Button 
                  onClick={handleContinueToPayment}
                  className="flex-1 text-sm"
                  size="sm"
                >
                  Continuar com este endereço
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center gap-1 text-sm"
                  size="sm"
                >
                  <Plus className="w-3 h-3" />
                  Novo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(!selectedAddress || showAddressForm) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="w-4 h-4" />
                {selectedAddress ? 'Novo Endereço' : 'Cadastrar Endereço'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="rua">Rua *</Label>
                  <Input
                    id="rua"
                    placeholder="Nome da rua"
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número *</Label>
                  <Input
                    id="numero"
                    placeholder="123"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="rounded-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento (opcional)</Label>
                <Input
                  id="complemento"
                  placeholder="Apartamento, bloco, etc."
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className="rounded-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input
                    id="bairro"
                    placeholder="Nome do bairro"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    placeholder="Nome da cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="rounded-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2 relative" ref={dropdownRef}>
                  <Label htmlFor="estado">Estado *</Label>
                  <div className="relative">
                    <Input
                      ref={estadoInputRef}
                      id="estado"
                      placeholder="Digite ou selecione um estado"
                      value={estado}
                      onChange={(e) => handleEstadoChange(e.target.value)}
                      onFocus={() => {
                        if (estado.length === 0) {
                          setFilteredEstados(estadosBrasileiros);
                          setShowEstadoDropdown(true);
                        }
                      }}
                      className="rounded-full pr-10"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (showEstadoDropdown) {
                          setShowEstadoDropdown(false);
                        } else {
                          setFilteredEstados(estadosBrasileiros);
                          setShowEstadoDropdown(true);
                          estadoInputRef.current?.focus();
                        }
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${showEstadoDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showEstadoDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredEstados.length > 0 ? (
                          filteredEstados.map((estadoOption, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectEstado(estadoOption)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                            >
                              {estadoOption}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">Nenhum estado encontrado</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    className="rounded-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                {selectedAddress && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddressForm(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                )}
                <Button 
                  onClick={handleSaveAddress}
                  disabled={loading || !validateAddressForm()}
                  className="flex-1"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Endereço
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (currentStep === 'payment') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setCurrentStep('address')} className="p-1">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold">Forma de Pagamento</h2>
        </div>

        {/* Resumo do pedido */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{item.title || 'Verso Musical'}</p>
                    <p className="text-xs text-gray-600">{item.quantity}x R$ {item.price.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <span className="font-medium text-sm">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between items-center font-bold">
                <span>Total</span>
                <span className="text-primary text-lg">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métodos de pagamento */}
        <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="credit" className="flex items-center gap-1 text-xs">
              <CreditCard className="w-3 h-3" />
              Crédito
            </TabsTrigger>
            <TabsTrigger value="debit" className="flex items-center gap-1 text-xs">
              <CreditCard className="w-3 h-3" />
              Débito
            </TabsTrigger>
            <TabsTrigger value="pix" className="flex items-center gap-1 text-xs">
              <Smartphone className="w-3 h-3" />
              PIX
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credit" className="mt-6">
            <CardPaymentForm
              amount={totalPrice}
              description={`Compra de ${items.length} verso(s) - Musical em Bom Português`}
              payerEmail={user?.email || ''}
              items={items.map(item => ({
                title: item.title || 'Verso Musical',
                quantity: item.quantity,
                unit_price: item.price
              }))}
              paymentMethod="credit"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </TabsContent>

          <TabsContent value="debit" className="mt-6">
            <CardPaymentForm
              amount={totalPrice}
              description={`Compra de ${items.length} verso(s) - Musical em Bom Português`}
              payerEmail={user?.email || ''}
              items={items.map(item => ({
                title: item.title || 'Verso Musical',
                quantity: item.quantity,
                unit_price: item.price
              }))}
              paymentMethod="debit"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </TabsContent>

          <TabsContent value="pix" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smartphone className="w-4 h-4" />
                  PIX - Pagamento Instantâneo
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-3">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Valor a pagar:</p>
                    <p className="text-xl font-bold">R$ {totalPrice.toFixed(2).replace('.', ',')}</p>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Clique no botão abaixo para gerar o código PIX e finalizar seu pagamento de forma rápida e segura.
                  </p>
                  
                  <Button 
                    onClick={handleProcessPayment}
                    className="w-full" 
                    size="sm"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                    {loading ? 'Gerando PIX...' : 'Gerar código PIX'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  if (currentStep === 'processing') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => {
            setCurrentStep('payment');
            setPixQrCode('');
            setPixCopyPaste('');
          }} className="p-1">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold">Pagamento PIX</h2>
        </div>

        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <QrCode className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">PIX Gerado com Sucesso!</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Escaneie o QR Code ou copie o código para finalizar o pagamento
            </p>
          </div>
        </div>

        {pixQrCode && (
          <div className="space-y-3">
            {/* Valor */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Valor a pagar</p>
                  <p className="text-2xl font-bold text-primary">R$ {totalPrice.toFixed(2).replace('.', ',')}</p>
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-center text-sm">QR Code PIX</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 pb-4">
                <div className="flex justify-center">
                  <div className="bg-white p-2 rounded-lg border border-muted">
                    <img 
                      src={`data:image/png;base64,${pixQrCode}`} 
                      alt="QR Code PIX" 
                      className="w-32 h-32 sm:w-40 sm:h-40"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Código PIX */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Código PIX (Copia e Cola)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-2">
                <div className="bg-muted/50 p-2 rounded-lg">
                  <p className="font-mono text-xs break-all">{pixCopyPaste}</p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  size="sm"
                  onClick={copyPixCode}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar código PIX
                </Button>
              </CardContent>
            </Card>

            {/* Instruções */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Como pagar</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Abra o app do seu banco ou carteira digital</li>
                  <li>Escolha a opção <strong>PIX</strong></li>
                  <li>Escaneie o QR Code ou cole o código copiado</li>
                  <li>Confirme os dados e finalize o pagamento</li>
                </ol>
              </CardContent>
            </Card>

            {/* Status */}
            <div className="flex items-center justify-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="font-medium text-sm">Aguardando confirmação do pagamento...</span>
            </div>
          </div>
        )}

        {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
          <Card>
            <CardContent className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Processando pagamento...</p>
              <p className="text-gray-600 mt-2">Isso pode levar alguns segundos</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
};

export default CheckoutFlow;