import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import MercadoPagoService, { type InstallmentOption } from '@/services/mercadoPagoService';

interface CardPaymentFormProps {
  amount: number;
  description: string;
  payerEmail: string;
  items: any[];
  paymentMethod: 'credit' | 'debit';
  onSuccess: () => void;
  onError: (error: string) => void;
}



const CardPaymentForm = ({ 
  amount, 
  description, 
  payerEmail, 
  items, 
  paymentMethod, 
  onSuccess, 
  onError 
}: CardPaymentFormProps) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mpInstance, setMpInstance] = useState<any>(null);
  const [cardForm, setCardForm] = useState<any>(null);
  const [isTestMode, setIsTestMode] = useState(true);
  const [formData, setFormData] = useState({
    cardholderName: '',
    identificationType: 'CPF',
    identificationNumber: '',
    installments: 1
  });
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [bin, setBin] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);

  const formatBRL = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Carregar CPF do perfil do usuário ou dados de teste
  useEffect(() => {
    if (isTestMode) {
      setFormData(prev => ({ 
        ...prev, 
        cardholderName: 'APRO',
        identificationNumber: '12345678909'
      }));
    } else if (profile && profile.cpf) {
      // Só preenche se o perfil estiver carregado e tiver CPF
      setFormData(prev => ({ 
        ...prev, 
        cardholderName: '',
        identificationNumber: profile.cpf
      }));
    } else {
      // Limpa os campos se não estiver em modo teste e não tiver CPF
      setFormData(prev => ({ 
        ...prev, 
        cardholderName: '',
        identificationNumber: ''
      }));
    }
  }, [profile, isTestMode]);

  // Capturar BIN (6 primeiros dígitos) ao digitar o número do cartão
  useEffect(() => {
    const digits = (cardNumber || '').replace(/\D/g, '');
    const newBin = digits.slice(0, 6);
    console.log('💳 Captura BIN:', { cardNumber, digits, newBin, currentBin: bin });
    if (newBin !== bin) {
      setBin(newBin);
      console.log('🔄 BIN atualizado:', newBin);
    }
  }, [cardNumber]);

  // Detectar payment_method_id pelo SDK quando BIN mudar
  useEffect(() => {
    let cancelled = false;
    const detectPaymentMethod = async () => {
      if (paymentMethod !== 'credit') {
        setPaymentMethodId(null);
        return;
      }
      if (!bin || bin.length < 6) {
        setPaymentMethodId(null);
        return;
      }
      try {
        console.log('🔎 Detectando payment_method_id via SDK para BIN:', bin);
        const id = await MercadoPagoService.getPaymentMethodIdByBin(bin);
        if (!cancelled) {
          setPaymentMethodId(id);
          console.log('✅ payment_method_id detectado:', id);
        }
      } catch (e) {
        console.warn('⚠️ Falha ao detectar payment_method_id:', e);
        if (!cancelled) setPaymentMethodId(null);
      }
    };
    detectPaymentMethod();
    return () => { cancelled = true; };
  }, [bin, paymentMethod]);

  // Buscar opções de parcelas via SDK: requer payment_method_id ou BIN e amount
  useEffect(() => {
    let cancelled = false;
    const fetchInstallments = async () => {
      console.log('🔍 fetchInstallments - Debug:', { paymentMethod, bin, binLength: bin?.length, amount, paymentMethodId });
      
      if (paymentMethod !== 'credit') {
        console.log('❌ Não é crédito, pulando parcelas');
        setInstallmentOptions([]);
        return;
      }
      if ((!bin || bin.length < 6) && !paymentMethodId) {
        console.log('❌ Sem BIN suficiente e sem payment_method_id ainda. Aguardando...');
        setInstallmentOptions([]);
        return;
      }
      try {
        console.log('🚀 Buscando parcelas com:', { bin, amount, payment_method_id: paymentMethodId });
        setLoadingInstallments(true);
        const options = await MercadoPagoService.getInstallments({ 
          amount,
          payment_method_id: paymentMethodId || undefined,
          bin: bin && bin.length >= 6 ? bin : undefined
        });
        console.log('✅ Parcelas obtidas:', options);
        if (!cancelled) {
          setInstallmentOptions(options);
          const selectedExists = options.some(o => o.quantity === formData.installments);
          if (!selectedExists && options.length > 0) {
            setFormData(prev => ({ ...prev, installments: options[0].quantity }));
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar opções de parcelas:', error);
        if (!cancelled) {
          setInstallmentOptions([]);
        }
      } finally {
        if (!cancelled) setLoadingInstallments(false);
      }
    };
    fetchInstallments();
    return () => { cancelled = true; };
  }, [amount, paymentMethod, bin, paymentMethodId]);

  const cardNumberRef = useRef<HTMLInputElement>(null);
  const expirationDateRef = useRef<HTMLDivElement>(null);
  const securityCodeRef = useRef<HTMLDivElement>(null);
  const cardholderNameRef = useRef<HTMLInputElement>(null);
  const identificationNumberRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializeMercadoPago();
  }, []);

  const initializeMercadoPago = async () => {
    try {
      // Usar o novo MercadoPagoService
      await MercadoPagoService.loadMercadoPagoSDK();
      
      // Verificar se o SDK foi carregado
      if (!window.MercadoPago) {
        throw new Error('SDK do Mercado Pago não foi carregado');
      }

      toast({
        title: "SDK Carregado",
        description: "Sistema de pagamento inicializado com sucesso."
      });
    } catch (error: any) {
      console.error('Erro ao inicializar Mercado Pago:', error);
      onError('Erro ao inicializar sistema de pagamento');
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      onError('Usuário não autenticado');
      return;
    }

    setLoading(true);
    
    try {
      // Criar preferência de pagamento para cartão
      const preferenceData = {
        items: items.map(item => ({
          id: item.id || '',
          title: item.title || 'Produto',
          quantity: item.quantity || 1,
          unit_price: item.price || 0
        })),
        payer: {
          email: payerEmail
        },
        payment_methods: {
          excluded_payment_types: [
            { id: 'pix' },
            { id: 'ticket' }
          ],
          installments: paymentMethod === 'credit' ? 12 : 1
        },
        back_urls: {
          success: `${window.location.origin}/checkout/success`,
          failure: `${window.location.origin}/checkout/failure`,
          pending: `${window.location.origin}/checkout/pending`
        },
        auto_return: 'approved'
      };

      const result = await MercadoPagoService.createPaymentPreference(preferenceData);
      
      if (result.success && result.init_point) {
        // Redirecionar para o checkout do Mercado Pago
        window.location.href = result.init_point;
      } else {
        throw new Error(result.error || 'Erro ao criar preferência de pagamento');
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      onError(error.message || 'Erro ao processar pagamento');
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          {paymentMethod === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form id="form-checkout" className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* Número do cartão */}
          <div className="space-y-2">
            <Label>Número do cartão</Label>
            <Input
              id="form-checkout__cardNumber"
              ref={cardNumberRef}
              type="text"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Data de expiração */}
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <div 
                id="form-checkout__expirationDate" 
                ref={expirationDateRef}
                className="border rounded-lg p-3 min-h-[48px]"
              />
            </div>

            {/* Código de segurança */}
            <div className="space-y-2">
              <Label>CVV</Label>
              <div 
                id="form-checkout__securityCode" 
                ref={securityCodeRef}
                className="border rounded-lg p-3 min-h-[48px]"
              />
            </div>
          </div>

          {/* Nome do titular */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="form-checkout__cardholderName">Nome do titular</Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="test-mode" className="text-sm">Modo Teste</Label>
                <input
                  type="checkbox"
                  checked={isTestMode}
                  onChange={(e) => setIsTestMode(e.target.checked)}
                  className="rounded"
                />
              </div>
            </div>
            {isTestMode && (
              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded space-y-2">
                <div className="font-medium">💡 Modo teste ativo</div>
                <div className="space-y-1">
                  <div>• <strong>APRO</strong>: Pagamento aprovado</div>
                  <div>• <strong>OTHE</strong>: Erro geral</div>
                  <div>• <strong>Cartões válidos</strong>: 4509 9535 6623 3704 (Visa), 5031 7557 3453 0604 (Master)</div>
                  <div>• <strong>CVV</strong>: 123, <strong>Vencimento</strong>: 11/25</div>
                </div>
              </div>
            )}
            <Input
              id="form-checkout__cardholderName"
              ref={cardholderNameRef}
              type="text"
              value={formData.cardholderName}
              onChange={(e) => setFormData(prev => ({ ...prev, cardholderName: e.target.value }))}
              placeholder={isTestMode ? "APRO (teste aprovado)" : "Nome como está no cartão"}
              className="rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tipo de documento */}
            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <select 
                id="form-checkout__identificationType"
                className="w-full border rounded-lg p-3"
                value={formData.identificationType}
                onChange={(e) => setFormData(prev => ({ ...prev, identificationType: e.target.value }))}
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </div>

            {/* Número do documento */}
            <div className="space-y-2">
              <Label htmlFor="form-checkout__identificationNumber">Número do documento</Label>
              {isTestMode && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  ✅ CPF de teste: 12345678909
                </div>
              )}
              {!isTestMode && profile?.cpf && (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  ℹ️ CPF do seu perfil pré-preenchido (você pode alterar se necessário)
                </div>
              )}
              <Input
                id="form-checkout__identificationNumber"
                ref={identificationNumberRef}
                placeholder={isTestMode ? "12345678909 (CPF teste)" : "000.000.000-00"}
                value={formData.identificationNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, identificationNumber: e.target.value }))}
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Banco emissor */}
          <div className="space-y-2">
            <Label>Banco emissor</Label>
            <select 
              id="form-checkout__issuer"
              className="w-full border rounded-lg p-3"
            >
              <option value="">Selecione o banco</option>
            </select>
          </div>

          {/* Parcelas (apenas para crédito) */}
          {paymentMethod === 'credit' && (
            <>
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                🔍 Debug: loadingInstallments={String(loadingInstallments)}, options.length={installmentOptions.length}, bin="{bin}", paymentMethod="{paymentMethod}", paymentMethodId="{paymentMethodId}"
              </div>
              
              {loadingInstallments && (
                <div className="text-sm text-gray-500">Calculando parcelas e juros...</div>
              )}

              {!loadingInstallments && installmentOptions.length === 0 && bin && bin.length >= 6 && paymentMethodId && (
                <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                  ⚠️ Nenhuma opção de parcela disponível para este cartão.
                </div>
              )}

              {!loadingInstallments && installmentOptions.length === 0 && (!bin || bin.length < 6 || !paymentMethodId) && (
                <div className="text-sm text-gray-500">Digite um cartão válido para ver as opções de parcelamento.</div>
              )}

              {!loadingInstallments && installmentOptions.length > 0 && (
                <div className="space-y-2">
                  <Label>Parcelas</Label>
                  <select 
                    id="form-checkout__installments"
                    className="w-full border rounded-lg p-3"
                    value={formData.installments}
                    onChange={(e) => setFormData(prev => ({ ...prev, installments: parseInt(e.target.value) }))}
                  >
                    {installmentOptions.map((opt) => {
                      const baseTotal = (opt.amount ?? 0) * (opt.quantity ?? 0);
                      const total = typeof opt.total === 'number' ? opt.total : baseTotal;
                      const hasInterest = total > baseTotal + 0.009; // tolerância para arredondamento
                      const rateLabel = (opt.rate && opt.rate > 0)
                        ? `(juros de ${Number(opt.rate).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%)`
                        : (hasInterest ? '(com juros)' : '(sem juros)');
                      const label = `${opt.quantity}x de ${formatBRL(opt.amount)} ${rateLabel}`;
                      return (
                        <option key={opt.quantity} value={opt.quantity}>{label}</option>
                      );
                    })}
                  </select>
                </div>
              )}
            </>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={loading}
            onClick={(e) => { e.preventDefault(); handleSubmit(); }}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? 'Processando...' : `Pagar ${formatBRL(amount)}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CardPaymentForm;