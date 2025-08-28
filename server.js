import express from 'express';
import cors from 'cors';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Utilitário para obter token do Mercado Pago de forma resiliente
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || process.env.VITE_MERCADOPAGO_ACCESS_TOKEN;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Helper para gerar/obter X-Idempotency-Key
function resolveIdempotencyKey(req) {
  const raw = (req.get('x-idempotency-key') || req.get('X-Idempotency-Key') || '').toString().trim();
  const invalid = !raw || raw.toLowerCase() === 'null' || raw.toLowerCase() === 'undefined';
  if (!invalid) return raw;
  try {
    return randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

async function forwardToMercadoPagoPayments(req, res) {
  try {
    if (!MP_ACCESS_TOKEN) {
      console.error('MP_ACCESS_TOKEN não configurado no ambiente.');
      return res.status(500).json({ error: 'Mercado Pago Access Token não configurado' });
    }

    const idempotencyKey = resolveIdempotencyKey(req);
    
    // Log detalhado do payload enviado
    console.log('🔍 [MERCADO PAGO] Payload enviado:', JSON.stringify(req.body, null, 2));
    console.log('🔑 [MERCADO PAGO] Idempotency Key:', idempotencyKey);
    
    const upstream = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'x-idempotency-key': idempotencyKey,
      },
      body: JSON.stringify(req.body)
    });

    const text = await upstream.text();
    const payload = text ? (() => { try { return JSON.parse(text); } catch { return { raw: text }; } })() : {};
    
    // Log detalhado da resposta
    console.log('📥 [MERCADO PAGO] Status da resposta:', upstream.status);
    console.log('📥 [MERCADO PAGO] Resposta completa:', JSON.stringify(payload, null, 2));
    
    // Log específico para pagamentos rejeitados
    if (payload.status === 'rejected') {
      console.log('❌ [MERCADO PAGO] PAGAMENTO REJEITADO!');
      console.log('❌ [MERCADO PAGO] Status Detail:', payload.status_detail);
      console.log('❌ [MERCADO PAGO] Cause:', payload.cause);
      if (payload.cause && payload.cause.length > 0) {
        payload.cause.forEach((cause, index) => {
          console.log(`❌ [MERCADO PAGO] Causa ${index + 1}:`, cause);
        });
      }
    }

    return res.status(upstream.status).type('application/json').send(JSON.stringify(payload));
  } catch (error) {
    console.error('❌ [MERCADO PAGO] Erro no proxy:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Proxy para API do Mercado Pago
app.post('/api/mercadopago/payments', forwardToMercadoPagoPayments);

// Proxy para verificar status do pagamento
app.get('/api/mercadopago/payments/:paymentId', async (req, res) => {
  try {
    if (!MP_ACCESS_TOKEN) {
      console.error('MP_ACCESS_TOKEN não configurado no ambiente.');
      return res.status(500).json({ error: 'Mercado Pago Access Token não configurado' });
    }

    const { paymentId } = req.params;
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      }
    });

    const text = await response.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return { raw: text }; } })() : {};
    res.status(response.status).type('application/json').send(JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Aliases para compatibilizar com o frontend atual
app.post('/api/mercadopago/create-payment', forwardToMercadoPagoPayments);

app.get('/api/mercadopago/payment-status/:paymentId', async (req, res) => {
  try {
    if (!MP_ACCESS_TOKEN) {
      console.error('MP_ACCESS_TOKEN não configurado no ambiente.');
      return res.status(500).json({ error: 'Mercado Pago Access Token não configurado' });
    }

    const { paymentId } = req.params;
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      }
    });

    const text = await response.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return { raw: text }; } })() : {};
    res.status(response.status).type('application/json').send(JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao verificar status do pagamento (alias):', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar preferência de pagamento (Checkout Pro)
app.post('/api/mercadopago/preferences', async (req, res) => {
  try {
    if (!MP_ACCESS_TOKEN) {
      console.error('MP_ACCESS_TOKEN não configurado no ambiente.');
      return res.status(500).json({ error: 'Mercado Pago Access Token não configurado' });
    }

    const upstream = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const text = await upstream.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return { raw: text }; } })() : {};
    res.status(upstream.status).type('application/json').send(JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao criar preferência no Mercado Pago:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Métodos de pagamento padrão - sem usar BIN
app.get('/api/mercadopago/payment-methods', async (req, res) => {
  try {
    // Retorna métodos de pagamento comuns no Brasil sem depender de BIN
    const paymentMethods = [
      {
        id: "master",
        name: "Mastercard",
        payment_type_id: "credit_card",
        status: "active",
        secure_thumbnail: "https://www.mercadopago.com/org-img/MP3/API/logos/master.gif",
        thumbnail: "https://www.mercadopago.com/org-img/MP3/API/logos/master.gif",
        deferred_capture: "supported",
        settings: [],
        additional_info_needed: ["cardholder_name", "cardholder_identification_number"],
        min_allowed_amount: 0.01,
        max_allowed_amount: 25000000,
        accreditation_time: 2880,
        financial_institutions: [],
        processing_modes: ["aggregator"]
      },
      {
        id: "visa",
        name: "Visa",
        payment_type_id: "credit_card",
        status: "active",
        secure_thumbnail: "https://www.mercadopago.com/org-img/MP3/API/logos/visa.gif",
        thumbnail: "https://www.mercadopago.com/org-img/MP3/API/logos/visa.gif",
        deferred_capture: "supported",
        settings: [],
        additional_info_needed: ["cardholder_name", "cardholder_identification_number"],
        min_allowed_amount: 0.01,
        max_allowed_amount: 25000000,
        accreditation_time: 2880,
        financial_institutions: [],
        processing_modes: ["aggregator"]
      }
    ];

    res.status(200).json(paymentMethods);
  } catch (error) {
    console.error('Erro ao buscar métodos de pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Parcelas (installments) - sem usar BIN
app.get('/api/mercadopago/installments', async (req, res) => {
  try {
    if (!MP_ACCESS_TOKEN) {
      console.error('MP_ACCESS_TOKEN não configurado no ambiente.');
      return res.status(500).json({ error: 'Mercado Pago Access Token não configurado' });
    }

    const { amount, payment_method_id } = req.query;

    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : NaN;
    if (!parsedAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Parâmetro "amount" inválido' });
    }

    // Usa payment_method_id padrão se não fornecido
    const methodId = payment_method_id || 'credit_card';

    const params = new URLSearchParams();
    params.set('amount', String(parsedAmount));
    params.set('payment_type_id', 'credit_card');
    params.set('payment_method_id', methodId);

    const upstream = await fetch(`https://api.mercadopago.com/v1/payment_methods/installments?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      }
    });

    const text = await upstream.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return { raw: text }; } })() : {};
    return res.status(upstream.status).type('application/json').send(JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao buscar parcelas (installments):', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para servir o app React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor proxy rodando na porta ${PORT}`);
  console.log(`Proxy Mercado Pago configurado`);
});