
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronDown, MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface CheckoutAddressStepProps {
  onContinue: (address: Address) => void;
  onBack: () => void;
}

const CheckoutAddressStep = ({ onContinue, onBack }: CheckoutAddressStepProps) => {
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
  const { user } = useAuth();
  
  const estadosBrasileiros = [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
    "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
    "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
    "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
    "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
  ];

  useEffect(() => {
    loadAddresses();
  }, [user]);

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

  const handleContinue = () => {
    if (!selectedAddressId) {
      toast({
        title: "Selecione um endereço",
        description: "Selecione um endereço para continuar",
        variant: "destructive",
      });
      return;
    }
    
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    if (selectedAddress) {
      onContinue(selectedAddress);
    }
  };

  if (loadingAddresses) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
          <h3 className="font-semibold text-lg">Endereço de Entrega</h3>
          <p className="text-sm text-gray-600">Selecione ou adicione um endereço</p>
        </div>
      </div>

      {/* Lista de endereços */}
      {addresses.length > 0 && !showAddForm && (
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Endereços Salvos
          </h4>
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
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="radio"
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id!)}
                      className="text-primary"
                    />
                    {address.is_default && (
                      <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-sm">
                    {address.rua}, {address.numero}
                    {address.complemento && `, ${address.complemento}`}
                  </p>
                  <p className="text-xs text-gray-600">
                    {address.bairro}, {address.cidade} - {address.estado}
                  </p>
                  <p className="text-xs text-gray-600">CEP: {address.cep}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAddress(address.id!);
                  }}
                  className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
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
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Novo Endereço
        </Button>
      )}

      {/* Formulário de novo endereço */}
      {showAddForm && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Novo Endereço</h4>
            {addresses.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="text-gray-500"
              >
                Cancelar
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="rua" className="text-sm">Rua *</Label>
              <Input
                id="rua"
                placeholder="Nome da rua"
                value={rua}
                onChange={(e) => setRua(e.target.value)}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="numero" className="text-sm">Número *</Label>
              <Input
                id="numero"
                placeholder="123"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="complemento" className="text-sm">Complemento</Label>
            <Input
              id="complemento"
              placeholder="Apartamento, bloco, etc."
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="bairro" className="text-sm">Bairro *</Label>
              <Input
                id="bairro"
                placeholder="Nome do bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="cidade" className="text-sm">Cidade *</Label>
              <Input
                id="cidade"
                placeholder="Nome da cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 relative" ref={dropdownRef}>
              <Label htmlFor="estado" className="text-sm">Estado *</Label>
              <div className="relative">
                <Input
                  ref={estadoInputRef}
                  id="estado"
                  placeholder="Digite ou selecione"
                  value={estado}
                  onChange={(e) => handleEstadoChange(e.target.value)}
                  onFocus={() => {
                    if (estado.length === 0) {
                      setFilteredEstados(estadosBrasileiros);
                      setShowEstadoDropdown(true);
                    }
                  }}
                  className="text-sm pr-8"
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
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <ChevronDown className={`h-3 w-3 transition-transform ${showEstadoDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showEstadoDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredEstados.length > 0 ? (
                      filteredEstados.map((estadoOption, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectEstado(estadoOption)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50"
                        >
                          {estadoOption}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        Nenhum estado encontrado
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="cep" className="text-sm">CEP *</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <Button
            onClick={handleSaveAddress}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Salvando..." : "Salvar Endereço"}
          </Button>
        </div>
      )}

      {/* Botão continuar */}
      {!showAddForm && addresses.length > 0 && (
        <Button
          onClick={handleContinue}
          disabled={!selectedAddressId}
          className="w-full"
        >
          Continuar para Pagamento
        </Button>
      )}
    </div>
  );
};

export default CheckoutAddressStep;
