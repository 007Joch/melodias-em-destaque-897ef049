export const onRequestPost = async ({ request, env }: { request: Request; env: any }) => {
  try {
    const MP_ACCESS_TOKEN = env.MP_ACCESS_TOKEN;

    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: 'Mercado Pago Access Token não configurado' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Garante o envio de X-Idempotency-Key (exigido para PIX e recomendado para pagamentos em geral)
    const rawHeader = request.headers.get('x-idempotency-key') ?? request.headers.get('X-Idempotency-Key') ?? '';
    const cleaned = (rawHeader ?? '').toString().trim();
    const isInvalid = !cleaned || cleaned.toLowerCase() === 'null' || cleaned.toLowerCase() === 'undefined';
    const fallbackId = (globalThis as any).crypto && typeof (globalThis as any).crypto.randomUUID === 'function'
      ? (globalThis as any).crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
    const idempotencyKey = isInvalid ? fallbackId : cleaned;

    const body = await request.text();
    const upstream = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        // header é case-insensitive, mas usamos minúsculas para evitar proxies que reescrevem
        'x-idempotency-key': idempotencyKey,
      },
      body,
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