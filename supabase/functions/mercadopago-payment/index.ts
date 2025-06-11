
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações do Mercado Pago
const MP_ACCESS_TOKEN = 'TEST-9000755864322739-040517-b78143b7c50807aac56e0ae931411b49-27094027';
const MP_PUBLIC_KEY = 'TEST-d72e3d17-e94f-4af6-a1e0-20b5be84c593';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { method, body } = await req.json();

    if (method === 'CREATE_PIX_PAYMENT') {
      const { amount, description, payer_email, user_id, items } = body;

      const paymentData = {
        transaction_amount: amount,
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: payer_email,
          first_name: 'Cliente',
          last_name: 'Musical',
          identification: {
            type: 'CPF',
            number: '00000000000'
          }
        },
        metadata: {
          user_id: user_id,
          items: items
        }
      };

      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const mpData = await mpResponse.json();

      if (mpResponse.ok) {
        return new Response(
          JSON.stringify({
            success: true,
            payment_id: mpData.id,
            status: mpData.status,
            qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
            qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        throw new Error(mpData.message || 'Erro ao criar pagamento PIX');
      }
    }

    if (method === 'CREATE_CARD_PAYMENT') {
      const { 
        amount, 
        description, 
        payer_email, 
        user_id, 
        items, 
        token, 
        payment_method_id, 
        installments, 
        cardholder_name,
        identification_type,
        identification_number 
      } = body;

      const paymentData = {
        transaction_amount: amount,
        description: description,
        payment_method_id: payment_method_id,
        token: token,
        installments: installments,
        payer: {
          email: payer_email,
          identification: {
            type: identification_type,
            number: identification_number,
          },
        },
        additional_info: {
          items: items.map((item: any) => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            unit_price: item.price,
          })),
          payer: {
            first_name: cardholder_name.split(' ')[0] || '',
            last_name: cardholder_name.split(' ').slice(1).join(' ') || '',
          },
        },
        metadata: {
          user_id: user_id,
          items: items
        }
      };

      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const mpData = await mpResponse.json();

      if (mpResponse.ok) {
        return new Response(
          JSON.stringify({
            success: true,
            payment_id: mpData.id,
            status: mpData.status,
            status_detail: mpData.status_detail,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        throw new Error(mpData.message || mpData.cause?.[0]?.description || 'Erro ao processar pagamento');
      }
    }

    if (method === 'CHECK_PAYMENT_STATUS') {
      const { payment_id } = body;

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        },
      });

      const mpData = await mpResponse.json();

      if (mpResponse.ok) {
        return new Response(
          JSON.stringify({
            success: true,
            status: mpData.status,
            status_detail: mpData.status_detail,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        throw new Error(mpData.message || 'Erro ao verificar status do pagamento');
      }
    }

    return new Response(
      JSON.stringify({ error: 'Método não suportado' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
