import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

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

const CheckoutAddress = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  
  // Form states
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);
  const [filteredEstados, setFilteredEstados] = useState<string[]>([]);
  
  const estadoInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, getTotalPrice } = useCart();
  
  const estadosBrasileiros = [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
    "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
    "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
    "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
    "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
  ];

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
    
    loadAddresses();
  }, [user, items, navigate]);

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

  const loadAddresses = async () => {
    try {
      // Se não estiver logado, não buscar no Supabase; exibir formulário para cadastro de endereço
      if (!user) {
        setAddresses([]);
        setShowAddForm(true);
        setLoadingAddresses(false);
        return;
      }

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      
      setAddresses(data || []);
      
      // Selecionar endereço padrão automaticamente
      const defaultAddress = data?.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (data && data.length > 0) {
        setSelectedAddressId(data[0].id);
      }
      
      // Se não há endereços, mostrar formulário
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
    } finally {
      setLoadingAddresses(false);
    }
  };

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

  const resetForm = () => {
    setRua("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("");
    setCep("");
  };

  const validateForm = () => {
    return rua.trim() !== "" && numero.trim() !== "" && bairro.trim() !== "" && 
           cidade.trim() !== "" && estado.trim() !== "" && cep.trim() !== "";
  };

  const handleSaveAddress = async () => {
    if (!validateForm()) {
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
        is_default: addresses.length === 0 // Primeiro endereço é padrão
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
      resetForm();
      
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

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      
      if (selectedAddressId === addressId) {
        const remainingAddresses = addresses.filter(addr => addr.id !== addressId);
        setSelectedAddressId(remainingAddresses.length > 0 ? remainingAddresses[0].id! : null);
      }
      
      toast({
        title: "Endereço removido",
        description: "Endereço removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover endereço:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover endereço",
        variant: "destructive",
      });
    }
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
    
    // Salvar endereço selecionado no localStorage para usar no checkout de pagamento
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    if (selectedAddress) {
      localStorage.setItem('checkout_address', JSON.stringify(selectedAddress));
      navigate('/checkout/payment');
    }
  };

  if (loadingAddresses) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando endereços...</p>
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
            onClick={() => navigate("/")}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Endereço de Cobrança</h1>
            <p className="text-gray-600">Selecione ou adicione um endereço para cobrança</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Endereços */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lista de endereços */}
            {addresses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Endereços Salvos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedAddressId === address.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedAddressId(address.id!)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="radio"
                              checked={selectedAddressId === address.id}
                              onChange={() => setSelectedAddressId(address.id!)}
                              className="text-primary"
                            />
                            {address.is_default && (
                              <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                                Padrão
                              </span>
                            )}
                          </div>
                          <p className="font-medium">
                            {address.rua}, {address.numero}
                            {address.complemento && `, ${address.complemento}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.bairro}, {address.cidade} - {address.estado}
                          </p>
                          <p className="text-sm text-gray-600">CEP: {address.cep}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAddress(address.id!);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Botão para adicionar novo endereço */}
            {!showAddForm && (
              <Button
                variant="outline"
                onClick={() => setShowAddForm(true)}
                className="w-full rounded-full py-6 border-dashed"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Novo Endereço
              </Button>
            )}

            {/* Formulário de novo endereço */}
            {showAddForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Novo Endereço</CardTitle>
                  <CardDescription>
                    Preencha os dados do seu endereço de cobrança
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rua" className="text-gray-700 font-medium">
                        Rua *
                      </Label>
                      <Input
                        id="rua"
                        type="text"
                        placeholder="Nome da rua"
                        value={rua}
                        onChange={(e) => setRua(e.target.value)}
                        className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="numero" className="text-gray-700 font-medium">
                        Número *
                      </Label>
                      <Input
                        id="numero"
                        type="text"
                        placeholder="123"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complemento" className="text-gray-700 font-medium">
                      Complemento (opcional)
                    </Label>
                    <Input
                      id="complemento"
                      type="text"
                      placeholder="Apartamento, bloco, etc."
                      value={complemento}
                      onChange={(e) => setComplemento(e.target.value)}
                      className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bairro" className="text-gray-700 font-medium">
                        Bairro *
                      </Label>
                      <Input
                        id="bairro"
                        type="text"
                        placeholder="Nome do bairro"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cidade" className="text-gray-700 font-medium">
                        Cidade *
                      </Label>
                      <Input
                        id="cidade"
                        type="text"
                        placeholder="Nome da cidade"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 relative" ref={dropdownRef}>
                      <Label htmlFor="estado" className="text-gray-700 font-medium">
                        Estado *
                      </Label>
                      <div className="relative">
                        <Input
                          ref={estadoInputRef}
                          id="estado"
                          type="text"
                          placeholder="Digite ou selecione um estado"
                          value={estado}
                          onChange={(e) => handleEstadoChange(e.target.value)}
                          onFocus={() => {
                            if (estado.length === 0) {
                              setFilteredEstados(estadosBrasileiros);
                              setShowEstadoDropdown(true);
                            }
                          }}
                          className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20 pr-10"
                          required
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
                              <div className="px-4 py-2 text-gray-500 text-sm">
                                Nenhum estado encontrado
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cep" className="text-gray-700 font-medium">
                        CEP *
                      </Label>
                      <Input
                        id="cep"
                        type="text"
                        placeholder="00000-000"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        className="rounded-full border-gray-200 focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        resetForm();
                      }}
                      className="flex-1 rounded-full"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveAddress}
                      disabled={loading}
                      className="flex-1 rounded-full"
                    >
                      {loading ? "Salvando..." : "Salvar Endereço"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumo do pedido */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
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
                    R$ {getTotalPrice().toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                <Button
                  onClick={handleContinueToPayment}
                  disabled={!selectedAddressId}
                  className="w-full rounded-full py-3 mt-6"
                >
                  Continuar para Pagamento
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutAddress;