const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

const MERCADO_PAGO_ACCESS_TOKEN = 'TEST-9000755864322739-040517-b78143b7c50807aac56e0ae931411b49-27094027';

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do build
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes

// Criar pagamento
app.post('/api/mercadopago/create-payment', async (req, res) => {
  try {
    const paymentData = req.body;

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro do Mercado Pago:', data);
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar status do pagamento
app.get('/api/mercadopago/payment-status/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Payment ID is required' });
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro do Mercado Pago:', data);
      return res.status(response.status).json(data);
    }

    res.status(200).json({
      id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      transaction_amount: data.transaction_amount,
      date_created: data.date_created,
      date_approved: data.date_approved,
    });
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Webhook do Mercado Pago (opcional para notificações)
app.post('/api/mercadopago/webhook', (req, res) => {
  console.log('Webhook recebido:', req.body);
  
  // Aqui você pode processar as notificações do Mercado Pago
  // Por exemplo, atualizar o status do pedido no banco de dados
  
  res.status(200).json({ received: true });
});

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});