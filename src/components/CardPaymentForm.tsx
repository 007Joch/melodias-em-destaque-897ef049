import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import MercadoPagoService from '@/services/mercadoPagoService';

interface CardPaymentFormProps {
  amount: number;
  description: string;
  payerEmail: string;
  items: any[];
  paymentMethod: 'credit' | 'debit';
  onSuccess: () => void;
  onError: (error: string) => void;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
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
  const [loading, setLoading] = useState(false);
  const [mpInstance, setMpInstance] = useState<any>(null);
  const [cardForm, setCardForm] = useState<any>(null);
  const [formData, setFormData] = useState({
    cardholderName: '',
    identificationType: 'CPF',
    identificationNumber: '',
    installments: 1
  });
  
  const cardNumberRef = useRef<HTMLDivElement>(null);
  const expirationDateRef = useRef<HTMLDivElement>(null);
  const securityCodeRef = useRef<HTMLDivElement>(null);
  const cardholderNameRef = useRef<HTMLInputElement>(null);
  const identificationNumberRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializeMercadoPago();
  }, []);

  const initializeMercadoPago = async () => {
    try {
      // Carregar SDK do Mercado Pago se não estiver carregado
      if (!window.MercadoPago) {
        await loadMercadoPagoSDK();
      }

      const mp = new window.MercadoPago('TEST-d72e3d17-e94f-4af6-a1e0-20b5be84c593', {
        locale: 'pt-BR'
      });

      setMpInstance(mp);
      
      // Criar formulário de cartão
      const cardFormInstance = mp.cardForm({
        amount: amount.toString(),
        iframe: true,
        form: {
          id: 'form-checkout',
          cardNumber: {
            id: 'form-checkout__cardNumber',
            placeholder: 'Número do cartão'
          },
          expirationDate: {
            id: 'form-checkout__expirationDate',
            placeholder: 'MM/YY'
          },
          securityCode: {
            id: 'form-checkout__securityCode',
            placeholder: 'Código de segurança'
          },
          cardholderName: {
            id: 'form-checkout__cardholderName',
            placeholder: 'Titular do cartão'
          },
          issuer: {
            id: 'form-checkout__issuer',
            placeholder: 'Banco emissor'
          },
          installments: {
            id: 'form-checkout__installments',
            placeholder: 'Parcelas'
          },
          identificationType: {
            id: 'form-checkout__identificationType',
            placeholder: 'Tipo de documento'
          },
          identificationNumber: {
            id: 'form-checkout__identificationNumber',
            placeholder: 'Número do documento'
          }
        },
        callbacks: {
          onFormMounted: (error: any) => {
            if (error) {
              console.error('Erro ao montar formulário:', error);
              onError('Erro ao carregar formulário de pagamento');
            }
          },
          onSubmit: (event: any) => {
            event.preventDefault();
            handleSubmit();
          },
          onFetching: (resource: string) => {
            console.log('Buscando recurso:', resource);
          }
        }
      });

      setCardForm(cardFormInstance);
    } catch (error: any) {
      console.error('Erro ao inicializar Mercado Pago:', error);
      onError('Erro ao inicializar sistema de pagamento');
    }
  };

  const loadMercadoPagoSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.MercadoPago) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar SDK do Mercado Pago'));
      document.head.appendChild(script);
    });
  };

  const handleSubmit = async () => {
    if (!cardForm) {
      onError('Formulário não inicializado');
      return;
    }

    setLoading(true);
    
    try {
      const cardData = await cardForm.getCardFormData();
      
      if (!cardData.token) {
        throw new Error('Erro ao processar dados do cartão');
      }

      // Processar pagamento
      const paymentData = {
        amount,
        description,
        payer_email: payerEmail,
        items
      };

      const result = await MercadoPagoService.createCardPayment({
        ...cardData,
        payment_method_id: paymentMethod === 'credit' ? cardData.payment_method_id : 'debit_card',
        installments: paymentMethod === 'credit' ? formData.installments : 1
      }, paymentData);

      if (result.success) {
        if (result.status === 'approved') {
          onSuccess();
        } else if (result.status === 'pending') {
          toast({
            title: "Pagamento pendente",
            description: "Seu pagamento está sendo processado. Você receberá uma confirmação em breve."
          });
          onSuccess();
        } else {
          throw new Error(result.status_detail || 'Pagamento não aprovado');
        }
      } else {
        throw new Error(result.error || 'Erro ao processar pagamento');
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      onError(error.message || 'Erro ao processar pagamento');
    } finally {
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
        <form id="form-checkout" className="space-y-4">
          {/* Número do cartão */}
          <div className="space-y-2">
            <Label>Número do cartão</Label>
            <div 
              id="form-checkout__cardNumber" 
              ref={cardNumberRef}
              className="border rounded-lg p-3 min-h-[48px]"
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
            <Label htmlFor="form-checkout__cardholderName">Nome do titular</Label>
            <Input
              id="form-checkout__cardholderName"
              ref={cardholderNameRef}
              placeholder="Nome como está no cartão"
              value={formData.cardholderName}
              onChange={(e) => setFormData(prev => ({ ...prev, cardholderName: e.target.value }))}
              className="rounded-lg"
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
              <Input
                id="form-checkout__identificationNumber"
                ref={identificationNumberRef}
                placeholder="000.000.000-00"
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
            <div className="space-y-2">
              <Label>Parcelas</Label>
              <select 
                id="form-checkout__installments"
                className="w-full border rounded-lg p-3"
                value={formData.installments}
                onChange={(e) => setFormData(prev => ({ ...prev, installments: parseInt(e.target.value) }))}
              >
                <option value="1">1x de R$ {amount.toFixed(2).replace('.', ',')} sem juros</option>
                <option value="2">2x de R$ {(amount / 2).toFixed(2).replace('.', ',')} sem juros</option>
                <option value="3">3x de R$ {(amount / 3).toFixed(2).replace('.', ',')} sem juros</option>
              </select>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? 'Processando...' : `Pagar R$ ${amount.toFixed(2).replace('.', ',')}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CardPaymentForm;