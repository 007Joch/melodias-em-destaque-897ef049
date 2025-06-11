
import { supabase } from '@/integrations/supabase/client';

interface PaymentData {
  amount: number;
  description: string;
  payer_email: string;
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
  }>;
}

interface CardFormData {
  token: string;
  payment_method_id: string;
  installments: number;
  issuer_id?: string;
  cardholderName: string;
  identificationType: string;
  identificationNumber: string;
}

class MercadoPagoService {
  static async createPixPayment(paymentData: PaymentData) {
    try {
      console.log('Criando pagamento PIX:', paymentData);

      const { data, error } = await supabase.functions.invoke('mercadopago-payment', {
        body: {
          transaction_amount: paymentData.amount,
          description: paymentData.description,
          payment_method_id: 'pix',
          payer: {
            email: paymentData.payer_email,
            first_name: 'Cliente',
            last_name: 'Musical',
            identification: {
              type: 'CPF',
              number: '00000000000'
            }
          },
          metadata: {
            items: paymentData.items
          }
        },
      });

      if (error) {
        console.error('Erro no edge function:', error);
        throw new Error(error.message || 'Erro ao criar pagamento PIX');
      }

      console.log('Resposta do PIX:', data);

      // Extrair QR Code e código copia e cola da resposta
      const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;
      const qrCode = data.point_of_interaction?.transaction_data?.qr_code;
      
      return {
        success: true,
        payment_id: data.id,
        status: data.status,
        qr_code_base64: qrCodeBase64,
        qr_code: qrCode
      };
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  static async checkPaymentStatus(paymentId: string) {
    try {
      console.log('Verificando status do pagamento:', paymentId);

      const { data, error } = await supabase.functions.invoke('mercadopago-payment', {
        method: 'GET',
        body: { payment_id: paymentId },
      });

      if (error) {
        console.error('Erro ao verificar status:', error);
        return {
          success: false,
          error: error.message || 'Erro ao verificar status do pagamento',
        };
      }

      return {
        success: true,
        status: data.status,
        status_detail: data.status_detail,
      };
    } catch (error: any) {
      console.error('Erro ao verificar status:', error);
      return {
        success: false,
        error: error.message || 'Erro de conexão',
      };
    }
  }

  static async createCardPayment(cardFormData: CardFormData, paymentData: PaymentData) {
    try {
      console.log('Criando pagamento com cartão:', { cardFormData, paymentData });

      const { data, error } = await supabase.functions.invoke('mercadopago-payment', {
        body: {
          transaction_amount: paymentData.amount,
          description: paymentData.description,
          payment_method_id: cardFormData.payment_method_id,
          token: cardFormData.token,
          installments: cardFormData.installments,
          issuer_id: cardFormData.issuer_id,
          payer: {
            email: paymentData.payer_email,
            identification: {
              type: cardFormData.identificationType,
              number: cardFormData.identificationNumber,
            },
          },
          metadata: {
            items: paymentData.items,
            payer: {
              first_name: cardFormData.cardholderName.split(' ')[0] || '',
              last_name: cardFormData.cardholderName.split(' ').slice(1).join(' ') || '',
            },
          },
        },
      });

      if (error) {
        console.error('Erro no edge function:', error);
        return {
          success: false,
          error: error.message || 'Erro ao processar pagamento com cartão',
        };
      }

      return {
        success: true,
        id: data.id,
        status: data.status,
        status_detail: data.status_detail,
      };
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      return {
        success: false,
        error: error.message || 'Erro de conexão',
      };
    }
  }
}

export default MercadoPagoService;
