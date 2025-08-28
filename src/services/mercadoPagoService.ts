// MercadoPago Service
// Integração client-side com SDK do Mercado Pago - Sem CORS
// Definições de tipos para o Mercado Pago
interface MercadoPagoInstance {
  checkout(options: any): void;
  createCardToken(options: any): Promise<any>;
  getIdentificationTypes(): Promise<any>;
}

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: any) => MercadoPagoInstance;
  }
}

interface PaymentData {
  amount: number;
  description: string;
  payer_email: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
  }>;
  // Cupom aplicado ao pagamento (opcional)
  coupon?: {
    code: string;
    discount_percent: number;
    discount_amount: number;
    original_total: number;
    final_total: number;
  };
}

interface CardData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

// Opções de parcelas padronizadas a partir da API de installments
export interface InstallmentOption {
  quantity: number;
  amount: number; // valor por parcela
  total?: number; // valor total
  rate?: number; // percentual de juros
  recommended_message?: string;
}

class MercadoPagoService {
  private mp: any = null;
  private isInitialized = false;
  private sdkLoaded = false;
  private static instance: MercadoPagoService;

  async loadMercadoPagoSDK(): Promise<boolean> {
    try {
      // Verificar se o SDK já está carregado
      if (this.sdkLoaded && (window as any).MercadoPago) {
        return true;
      }

      // Carregar o SDK dinamicamente
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;

      return new Promise((resolve, reject) => {
        script.onload = () => {
          console.log('Mercado Pago SDK carregado com sucesso');
          this.sdkLoaded = true;
          resolve(true);
        };
        script.onerror = () => {
          console.error('Erro ao carregar SDK do Mercado Pago');
          reject(false);
        };
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Erro ao carregar SDK do Mercado Pago:', error);
      return false;
    }
  }

  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized && this.mp) {
        return true;
      }

      const publicKey = (import.meta as any).env.VITE_MERCADOPAGO_PUBLIC_KEY;
      
      console.log('Inicializando Mercado Pago com chave:', publicKey ? publicKey.substring(0, 10) + '...' : 'não configurada');
      
      if (!publicKey) {
        throw new Error('Chave pública do Mercado Pago não configurada no arquivo .env');
      }

      // Carregar SDK se necessário
      const sdkLoaded = await this.loadMercadoPagoSDK();
      if (!sdkLoaded || !(window as any).MercadoPago) {
        throw new Error('Falha ao carregar SDK do Mercado Pago');
      }

      // Inicializar Mercado Pago
      this.mp = new (window as any).MercadoPago(publicKey, {
        locale: 'pt-BR'
      });

      this.isInitialized = true;
      console.log('Mercado Pago inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao inicializar Mercado Pago:', error);
      return false;
    }
  }

  async createPaymentPreference(preferenceData: any): Promise<any> {
    try {
      // Cria a preferência via backend para evitar CORS e proteger o token
      const response = await fetch('/api/mercadopago/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferenceData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Falha ao criar preferência');
      }

      return {
        success: true,
        id: data.id,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point
      };
    } catch (error) {
      console.error('Erro ao criar preferência de pagamento:', error);
      throw error;
    }
  }

  static getInstance(): MercadoPagoService {
    if (!MercadoPagoService.instance) {
      MercadoPagoService.instance = new MercadoPagoService();
    }
    return MercadoPagoService.instance;
  }

  async createCardToken(cardData: CardData): Promise<any> {
    try {
      if (!this.isInitialized) {
        console.log('Mercado Pago não inicializado, tentando inicializar...');
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Falha ao inicializar Mercado Pago. Verifique a chave pública.');
        }
      }
      
      if (!this.mp) {
        throw new Error('Instância do Mercado Pago não disponível');
      }

      const tokenData = {
        cardNumber: cardData.cardNumber,
        cardholderName: cardData.cardholderName,
        cardExpirationMonth: cardData.cardExpirationMonth,
        cardExpirationYear: cardData.cardExpirationYear,
        securityCode: cardData.securityCode,
        identificationType: cardData.identificationType,
        identificationNumber: cardData.identificationNumber
      };

      return await this.mp.createCardToken(tokenData);
    } catch (error) {
      console.error('Erro ao criar token do cartão:', error);
      throw error;
    }
  }

  async createCardPayment(cardFormData: any, paymentData: PaymentData, userId: string): Promise<any> {
    try {
      // Monta payload conforme API de pagamentos do Mercado Pago
      const body: any = {
        token: cardFormData.token,
        installments: cardFormData.installments || 1,
        transaction_amount: Number(paymentData.amount),
        description: paymentData.description,
        payer: {
          email: paymentData.payer_email,
          identification: {
            type: cardFormData.identificationType || 'CPF',
            number: cardFormData.identificationNumber
          }
        },
        capture: true,
        metadata: {
          user_id: userId,
          items: paymentData.items,
          ...(paymentData.coupon ? { coupon: paymentData.coupon } : {})
        }
      };

      if (cardFormData.payment_method_id) {
        body.payment_method_id = cardFormData.payment_method_id;
      }

      const response = await fetch('/api/mercadopago/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Falha ao processar pagamento');
      }

      return {
        success: true,
        status: data.status,
        payment_id: data.id,
        status_detail: data.status_detail
      };
    } catch (error) {
      console.error('Erro ao processar pagamento com cartão:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async createPixPayment(paymentData: PaymentData, userId: string): Promise<any> {
    try {
      // Monta payload para PIX conforme API do Mercado Pago
      const body = {
        transaction_amount: Number(paymentData.amount),
        description: paymentData.description,
        payment_method_id: 'pix',
        payer: {
          email: paymentData.payer_email
        },
        metadata: {
          user_id: userId,
          items: paymentData.items,
          ...(paymentData.coupon ? { coupon: paymentData.coupon } : {})
        }
      };

      const response = await fetch('/api/mercadopago/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Falha ao criar pagamento PIX');
      }

      const qrCode = data?.point_of_interaction?.transaction_data?.qr_code || data?.qr_code || '';
      const qrCodeBase64 = data?.point_of_interaction?.transaction_data?.qr_code_base64 || data?.qr_code_base64 || '';

      return {
        success: true,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        payment_id: data.id
      };
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Busca as opções de parcelas com juros via SDK oficial do Mercado Pago
  async getInstallments(params: { amount: number; payment_method_id?: string; bin?: string }): Promise<InstallmentOption[]> {
    try {
      console.log('🔍 getInstallments - Parâmetros recebidos:', params);

      // Para pagamentos à vista (1x), se não houver BIN e nem payment_method_id, retornamos vazio
      if (!params.bin && !params.payment_method_id) {
        console.log('❌ getInstallments - Sem BIN e sem payment_method_id, retornando vazio');
        return [];
      }

      // Garantir SDK inicializado
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) throw new Error('Falha ao inicializar SDK do Mercado Pago');
      }

      if (!this.mp || typeof (this.mp as any).getInstallments !== 'function') {
        throw new Error('SDK do Mercado Pago indisponível');
      }

      // Preparar parâmetros para SDK v2 - apenas amount e bin
      const sdkParams: any = {
        amount: String(params.amount), // SDK v2 espera string
        locale: 'pt-BR'
      };

      // SDK v2 só aceita BIN, não payment_method_id diretamente
      if (params.bin && params.bin.length >= 6) {
        sdkParams.bin = params.bin;
        console.log('✅ Usando BIN:', params.bin);
      } else {
        console.log('❌ BIN não fornecido ou insuficiente, usando amount apenas');
      }

      console.log('📤 getInstallments - Chamando SDK v2 com:', sdkParams);

      const sdkResponse: any = await (this.mp as any).getInstallments(sdkParams);

      console.log('📥 getInstallments - Resposta completa do SDK v2:', JSON.stringify(sdkResponse, null, 2));

      // SDK v2 retorna array de objetos com payer_costs
      if (!Array.isArray(sdkResponse) || sdkResponse.length === 0) {
        console.warn('⚠️ SDK v2 retornou array vazio ou inválido');
        return [];
      }

      // Buscar payer_costs no primeiro elemento
      const firstMethod = sdkResponse[0];
      const payerCosts = firstMethod?.payer_costs;
      
      console.log('🔍 payer_costs extraído do SDK v2:', payerCosts);
      console.log('✅ payer_costs.length:', payerCosts?.length || 0);

      if (!Array.isArray(payerCosts) || payerCosts.length === 0) {
        console.warn('⚠️ payer_costs vazio no SDK v2 - revisar parâmetros enviados');
        return [];
      }

      // A resposta do SDK v2 tem estrutura: [{ payer_costs: [...] }]
      const options: InstallmentOption[] = [];

      for (const item of payerCosts) {
        const quantity = item?.installments;
        const amount = item?.installment_amount;
        const total = item?.total_amount;
        const rate = item?.installment_rate;
        const recommended_message = item?.recommended_message;
        
        console.log(`💳 Processando parcela ${quantity}x:`, { quantity, amount, total, rate, recommended_message });
        
        if (quantity && amount) {
          options.push({ quantity, amount, total, rate, recommended_message });
        }
      }

      options.sort((a, b) => a.quantity - b.quantity);
      console.log('✅ getInstallments - Opções finais do SDK v2:', options);
      return options;
    } catch (error) {
      console.error('❌ Erro ao obter opções de parcelas (SDK v2):', error);
      return [];
    }
  }

  // Método para detectar payment_method_id baseado no BIN
  async getPaymentMethodIdByBin(bin: string): Promise<string | null> {
    try {
      if (!bin || bin.length < 6) {
        console.log('❌ getPaymentMethodIdByBin - BIN inválido:', bin);
        return null;
      }

      // Garantir SDK inicializado
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) throw new Error('Falha ao inicializar SDK do Mercado Pago');
      }

      if (!this.mp || typeof (this.mp as any).getPaymentMethods !== 'function') {
        console.warn('⚠️ getPaymentMethods não disponível no SDK');
        return null;
      }

      console.log('🔍 getPaymentMethodIdByBin - Detectando payment_method_id para BIN:', bin);

      const paymentMethods = await (this.mp as any).getPaymentMethods({
        bin: bin
      });

      console.log('📥 getPaymentMethodIdByBin - Resposta completa:', JSON.stringify(paymentMethods, null, 2));

      // Extrair o primeiro payment_method_id encontrado
      const results = paymentMethods?.results || paymentMethods || [];
      const firstMethod = Array.isArray(results) ? results[0] : results;
      const paymentMethodId = firstMethod?.id || null;

      console.log('✅ payment_method_id detectado:', paymentMethodId);
      return paymentMethodId;
    } catch (error) {
      console.error('❌ Erro ao detectar payment_method_id:', error);
      return null;
    }
  }

  async checkPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await fetch(`/api/mercadopago/payment-status/${paymentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Falha ao verificar status do pagamento');
      }

      return {
        success: true,
        status: data.status,
        status_detail: data.status_detail
      };
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

export default MercadoPagoService.getInstance();