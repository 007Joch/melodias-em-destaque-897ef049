
// Serviço para integração com Mercado Pago

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
  private static readonly ACCESS_TOKEN = 'TEST-9000755864322739-040517-b78143b7c50807aac56e0ae931411b49-27094027';
  private static readonly API_URL = 'https://api.mercadopago.com/v1';

  static async createPixPayment(paymentData: PaymentData) {
    try {
      const response = await fetch(`${this.API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
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
      const response = await fetch(`${this.API_URL}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          status: data.status,
          status_detail: data.status_detail,
        };
      } else {
        return {
          success: false,
          error: data.message || 'Erro ao verificar status do pagamento',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro de conexão',
      };
    }
  }

  static async createCardPayment(cardFormData: CardFormData, paymentData: PaymentData) {
    try {
      const response = await fetch(`${this.API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
          additional_info: {
            items: paymentData.items,
            payer: {
              first_name: cardFormData.cardholderName.split(' ')[0] || '',
              last_name: cardFormData.cardholderName.split(' ').slice(1).join(' ') || '',
            },
          },
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          id: data.id,
          status: data.status,
          status_detail: data.status_detail,
        };
      } else {
        return {
          success: false,
          error: data.message || data.cause?.[0]?.description || 'Erro ao processar pagamento com cartão',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro de conexão',
      };
    }
  }
}

export default MercadoPagoService;
