
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentData {
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  token?: string;
  installments?: number;
  issuer_id?: string;
  metadata?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MERCADO_PAGO_ACCESS_TOKEN = 'TEST-9000755864322739-040517-b78143b7c50807aac56e0ae931411b49-27094027';
    
    if (req.method === 'POST') {
      const paymentData: PaymentData = await req.json();
      
      console.log('Criando pagamento:', paymentData);

      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();
      
      console.log('Resposta do Mercado Pago:', data);

      if (!response.ok) {
        console.error('Erro do Mercado Pago:', data);
        return new Response(
          JSON.stringify({ 
            error: data.message || 'Erro ao processar pagamento',
            details: data 
          }),
          { 
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify(data),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const paymentId = url.pathname.split('/').pop();
      
      if (!paymentId) {
        return new Response(
          JSON.stringify({ error: 'Payment ID is required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Verificando status do pagamento:', paymentId);

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      console.log('Status do pagamento:', data);

      if (!response.ok) {
        console.error('Erro ao verificar status:', data);
        return new Response(
          JSON.stringify({ 
            error: data.message || 'Erro ao verificar status',
            details: data 
          }),
          { 
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          id: data.id,
          status: data.status,
          status_detail: data.status_detail,
          transaction_amount: data.transaction_amount,
          date_created: data.date_created,
          date_approved: data.date_approved,
          payment_method_id: data.payment_method_id,
          point_of_interaction: data.point_of_interaction,
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro no edge function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
