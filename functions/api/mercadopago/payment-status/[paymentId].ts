export const onRequestGet = async ({ params, env }: { params: any; env: any }) => {
  try {
    const MP_ACCESS_TOKEN = env.MP_ACCESS_TOKEN;

    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: 'Mercado Pago Access Token não configurado' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const paymentId = params.paymentId;
    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'paymentId é obrigatório' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const upstream = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
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