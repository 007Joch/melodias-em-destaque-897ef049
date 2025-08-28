
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronDown, MapPin, Plus, Edit } from "lucide-react";
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
      // Carregar apenas o endereço do perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('endereco')
        .eq('id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao carregar perfil:', profileError);
      }

      let profileAddress = null;
      
      // Se existe endereço no perfil, usar ele
      if (profileData?.endereco) {
        let addr;
        
        // O endereço sempre vem como string JSON do banco
        if (typeof profileData.endereco === 'string') {
          try {
            addr = JSON.parse(profileData.endereco);
          } catch (e) {
            console.error('Erro ao fazer parse do endereço:', e);
            addr = null;
          }
        } else {
          // Caso seja objeto (não deveria acontecer, mas por segurança)
          addr = profileData.endereco;
        }
        
        // Verificar se o endereço do perfil tem todos os campos necessários
        if (addr && addr.rua && addr.numero && addr.bairro && 
            addr.cidade && addr.estado && addr.cep) {
          
          profileAddress = {
            id: 'profile-address',
            rua: addr.rua,
            numero: addr.numero,
            complemento: addr.complemento || '',
            bairro: addr.bairro,
            cidade: addr.cidade,
            estado: addr.estado,
            cep: addr.cep,
            is_default: true
          };
        }
      }
      
      if (profileAddress) {
        setAddresses([profileAddress]);
        setSelectedAddressId(profileAddress.id);
      } else {
        setAddresses([]);
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

  const loadAddressToForm = (address: Address) => {
    setRua(address.rua || "");
    setNumero(address.numero || "");
    setComplemento(address.complemento || "");
    setBairro(address.bairro || "");
    setCidade(address.cidade || "");
    setEstado(address.estado || "");
    setCep(address.cep || "");
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
      const addressData = {
        rua,
        numero,
        complemento: complemento || '',
        bairro,
        cidade,
        estado,
        cep
      };

      // Atualizar o endereço no perfil do usuário (salvar como JSON string)
      const { error } = await supabase
        .from('profiles')
        .update({ endereco: JSON.stringify(addressData) })
        .eq('id', user?.id);

      if (error) throw error;

      // Criar o objeto de endereço para exibição
      const updatedAddress = {
        id: 'profile-address',
        ...addressData,
        is_default: true
      };

      setAddresses([updatedAddress]);
      setSelectedAddressId(updatedAddress.id);
      setShowAddForm(false);
      resetForm();
      
      toast({
        title: "Endereço atualizado",
        description: "Endereço atualizado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar endereço",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          <h3 className="font-semibold text-lg">Endereço de Cobrança</h3>
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
                    {address.id === 'profile-address' && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        Perfil
                      </span>
                    )}
                    {address.is_default && address.id !== 'profile-address' && (
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

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botão para atualizar endereço */}
      {!showAddForm && (
        <Button
          variant="outline"
          onClick={() => {
            // Carregar dados do endereço existente no formulário
            if (addresses.length > 0) {
              loadAddressToForm(addresses[0]);
            }
            setShowAddForm(true);
          }}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Atualizar endereço
        </Button>
      )}

      {/* Formulário de novo endereço */}
      {showAddForm && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Atualizar Endereço</h4>
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
                {loading ? "Atualizando..." : "Atualizar"}
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
