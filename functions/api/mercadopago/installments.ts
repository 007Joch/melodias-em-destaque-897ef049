export const onRequestGet = async ({ request, env }: { request: Request; env: any }) => {
  try {
    const url = new URL(request.url);
    const amount = url.searchParams.get('amount');
    const payment_method_id = url.searchParams.get('payment_method_id');

    const MP_ACCESS_TOKEN = env.MP_ACCESS_TOKEN;
    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: 'Mercado Pago Access Token não configurado' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!amount || isNaN(Number(amount))) {
      return new Response(JSON.stringify({ error: 'Parâmetro "amount" inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Para buscar parcelas apenas com payment_method_id (recomendado pela API do Mercado Pago)
    if (!payment_method_id) {
      return new Response(JSON.stringify({ error: 'Parâmetro "payment_method_id" é obrigatório' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const qs = new URLSearchParams();
    qs.set('amount', String(amount));
    qs.set('payment_method_id', payment_method_id);

    const upstream = await fetch(`https://api.mercadopago.com/v1/payment_methods/installments?${qs.toString()}` , {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
    });

    const text = await upstream.text();
    const content = text ? (() => { try { return JSON.parse(text); } catch { return { raw: text }; } })() : {};

    return new Response(JSON.stringify(content), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Erro interno do servidor', details: error?.message || String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};