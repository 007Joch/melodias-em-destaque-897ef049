// Cloudflare Pages Function para envio de e-mails
// Endpoint: /api/send-email

interface CartItem {
  id: string;
  title: string;
  artist: string;
  category: string;
  image?: string;
  price: number;
  quantity?: number;
  // Metadados de cupom (presentes quando um cupom foi aplicado)
  coupon?: {
    code?: string;
    discount_percent: number;
    discount_amount: number;
    original_total: number;
    final_total: number;
  };
}

interface VerseData {
  id: number;
  titulo_original: string;
  titulo_pt_br: string;
  musical: string;
  url_imagem: string;
  classificacao_vocal_alt: string[];
  pdf: string;
  valor: number;
}

interface EmailRequest {
  userEmail: string;
  userName: string;
  cartItems?: CartItem[];
  paymentId?: string;
  totalAmount?: number;
  subject?: string;
  message?: string;
}

// Função removida - agora usamos dados do carrinho diretamente

// Função para obter dados do carrinho com fallback
const getCartData = (context: any) => {
  let cartData = null;
  try {
    const cartDataStr = context.env.cartDataStorage;
    if (cartDataStr) {
      cartData = JSON.parse(cartDataStr);
      console.log('🛒 [send-email] Dados do carrinho encontrados:', cartData);
    } else {
      console.log('⚠️ [send-email] Nenhum dado do carrinho encontrado no storage');
    }
  } catch (error) {
    console.error('❌ [send-email] Erro ao obter dados do carrinho:', error);
  }
  return cartData;
};

// Função para enviar e-mail via Resend
const sendEmail = async (to: string, subject: string, html: string, resendApiKey: string) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Musical em Bom Português <contato@musicalembomportugues.com.br>',
      to: [to],
      subject,
      html
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao enviar e-mail: ${response.statusText} - ${error}`);
  }

  return await response.json();
};

// Função para buscar dados completos dos versos do Supabase
const fetchVerseDetails = async (verseIds: string[], supabaseUrl: string, supabaseKey: string): Promise<VerseData[]> => {
  try {
    console.log('🔍 [fetchVerseDetails] Buscando dados dos versos:', verseIds);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/versoes?select=id,titulo_original,titulo_pt_br,musical,url_imagem,classificacao_vocal_alt,pdf,valor&id=in.(${verseIds.join(',')})`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar versos: ${response.statusText}`);
    }
    
    const verses = await response.json();
    console.log('✅ [fetchVerseDetails] Versos encontrados:', verses.length);
    return verses;
  } catch (error) {
    console.error('❌ [fetchVerseDetails] Erro ao buscar versos:', error);
    return [];
  }
};

// Função para gerar HTML do e-mail de confirmação de compra
const generatePurchaseEmailHTML = (userName: string, verses: VerseData[], paymentId: string, totalAmount: number, couponSummary?: { original_total: number; discount_amount: number; discount_percent: number; final_total: number; code?: string }, paymentInfo?: { method: 'credit' | 'debit' | 'pix' | 'other'; installments?: number; totalPaid?: number; perInstallment?: number }, baseTotal?: number): string => {
  console.log('🎨 [generatePurchaseEmailHTML] Iniciando geração do HTML:', {
    userName,
    versesCount: verses?.length || 0,
    paymentId,
    totalAmount,
    hasCoupon: !!couponSummary,
    verses: verses?.map(verse => ({ id: verse?.id, title: verse?.titulo_pt_br || verse?.titulo_original, price: verse?.valor })) || []
  });
  
  if (!verses || verses.length === 0) {
    console.error('❌ [generatePurchaseEmailHTML] Dados dos versos vazios ou inválidos');
    throw new Error('Dados dos versos não encontrados');
  }
  
  const itemsHTML = verses.map(verse => {
    const imageUrl = verse.url_imagem || 'https://hlrcvvaneofcpncbqjyg.supabase.co/storage/v1/object/public/capas//Icone_400_x_400.jpg';
    const title = verse.titulo_original;
    const classificationsArray = verse.classificacao_vocal_alt || [];
    const classificationsHTML = classificationsArray.length > 0 
      ? classificationsArray.map(classificacao => 
          `<span style="background-color: #f3e8ff; color: #5E2C7E; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; border: 1px solid #e9d5ff; margin-right: 8px; margin-bottom: 4px; display: inline-block;">${classificacao}</span>`
        ).join('')
      : '<span style="background-color: #f3e8ff; color: #5E2C7E; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; border: 1px solid #e9d5ff;">Sem classificação</span>';
    const price = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(verse.valor || 0);
    
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; background-color: #ffffff; overflow: hidden;">
        <tr>
          <td style="padding: 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="100" style="vertical-align: top; padding-right: 16px;">
                  <img src="${imageUrl}" alt="${title}" style="width: 80px; height: 80px; border-radius: 8px; border: 2px solid #f3f4f6; display: block;" />
                </td>
                <td style="vertical-align: top;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: bold;">${title}</h3>
                  <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${verse.musical}</p>
                  <div style="margin-bottom: 12px; line-height: 1.5;">
                    ${classificationsHTML}
                  </div>
                  <p style="margin: 0; color: #1f2937; font-weight: bold; font-size: 16px;">${price}</p>
                </td>
              </tr>
              ${verse.pdf ? `
              <tr>
                <td colspan="2" style="padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <a href="${verse.pdf}" 
                     style="display: inline-block; background-color: #5E2C7E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 14px;"
                     target="_blank">
                    📄 Baixar PDF
                  </a>
                </td>
              </tr>
              ` : ''}
            </table>
          </td>
        </tr>
      </table>
    `;
  }).join('');
  
  const totalFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(totalAmount);

  // Valores do cupom, quando aplicável
  const originalTotalFormatted = couponSummary ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(couponSummary.original_total) : null;
  const discountAmountFormatted = couponSummary ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(couponSummary.discount_amount) : null;
  const finalTotalFormatted = couponSummary ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(couponSummary.final_total) : null;

  // Totais auxiliares
  const computedBaseTotal = typeof baseTotal === 'number' ? baseTotal : verses.reduce((sum, v) => sum + (typeof v.valor === 'number' ? v.valor : 0), 0);
  const baseTotalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(computedBaseTotal);
  const totalPaidFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paymentInfo?.totalPaid ?? totalAmount);
  const perInstallmentFormatted = typeof paymentInfo?.perInstallment === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paymentInfo.perInstallment) : null;
  const interestAmount = (paymentInfo?.method === 'credit' && typeof paymentInfo?.totalPaid === 'number')
    ? paymentInfo.totalPaid - (couponSummary ? couponSummary.final_total : computedBaseTotal)
    : 0;
  const interestAmountFormatted = interestAmount > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(interestAmount) : null;

  // Montagem dinâmica das linhas do resumo conforme método de pagamento
  let summaryRows = '';
  if (paymentInfo?.method === 'credit') {
    summaryRows = `
      <tr>
        <td style="color: #374151; padding: 6px 0;">Total antes do desconto:</td>
        <td style="text-align: right; color: #1f2937;">${couponSummary ? originalTotalFormatted : baseTotalFormatted}</td>
      </tr>
      ${couponSummary ? `
      <tr>
        <td style="color: #374151; padding: 6px 0;">Desconto aplicado${couponSummary.code ? ` (cupom ${couponSummary.code})` : ''}:</td>
        <td style="text-align: right; color: #b91c1c; font-weight: bold;">- ${discountAmountFormatted}</td>
      </tr>
      <tr>
        <td style="color: #374151; padding: 6px 0;">Porcentagem do desconto:</td>
        <td style="text-align: right; color: #1f2937;">${couponSummary.discount_percent}%</td>
      </tr>
      ` : ''}
      <tr>
        <td style="color: #374151; padding: 6px 0;">Pagamento:</td>
        <td style="text-align: right; color: #1f2937;">
          ${paymentInfo.installments && paymentInfo.installments > 1
            ? `${paymentInfo.installments}x de ${perInstallmentFormatted} (com juros)`
            : `1x (à vista)`}
        </td>
      </tr>
      ${interestAmountFormatted ? `
      <tr>
        <td style="color: #374151; padding: 6px 0;">Juros do parcelamento:</td>
        <td style="text-align: right; color: #1f2937;">${interestAmountFormatted}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="color: #374151; font-weight: bold; font-size: 16px; padding: 8px 0;">Total final${paymentInfo.installments && paymentInfo.installments > 1 ? ' (com juros)' : ''}:</td>
        <td style="text-align: right; color: #5E2C7E; font-weight: bold; font-size: 20px;">${totalPaidFormatted}</td>
      </tr>
    `;
  } else if (paymentInfo?.method === 'debit') {
    const finalForDebit = couponSummary ? finalTotalFormatted : baseTotalFormatted;
    summaryRows = `
      <tr>
        <td style="color: #374151; padding: 6px 0;">Total antes do desconto:</td>
        <td style="text-align: right; color: #1f2937;">${couponSummary ? originalTotalFormatted : baseTotalFormatted}</td>
      </tr>
      ${couponSummary ? `
      <tr>
        <td style="color: #374151; padding: 6px 0;">Desconto aplicado${couponSummary.code ? ` (cupom ${couponSummary.code})` : ''}:</td>
        <td style="text-align: right; color: #b91c1c; font-weight: bold;">- ${discountAmountFormatted}</td>
      </tr>
      <tr>
        <td style="color: #374151; padding: 6px 0;">Porcentagem do desconto:</td>
        <td style="text-align: right; color: #1f2937;">${couponSummary.discount_percent}%</td>
      </tr>
      ` : ''}
      <tr>
        <td style="color: #374151; padding: 6px 0;">Forma de pagamento:</td>
        <td style="text-align: right; color: #1f2937;">Cartão de débito - à vista</td>
      </tr>
      <tr>
        <td style="color: #374151; font-weight: bold; font-size: 16px; padding: 8px 0;">Total final com desconto:</td>
        <td style="text-align: right; color: #5E2C7E; font-weight: bold; font-size: 20px;">${finalForDebit}</td>
      </tr>
    `;
  } else {
    // PIX ou método desconhecido - mantém comportamento anterior
    summaryRows = couponSummary ? `
      <tr>
        <td style="color: #374151; padding: 6px 0;">Total antes do desconto:</td>
        <td style="text-align: right; color: #1f2937;">${originalTotalFormatted}</td>
      </tr>
      <tr>
        <td style="color: #374151; padding: 6px 0;">Desconto aplicado:</td>
        <td style="text-align: right; color: #b91c1c; font-weight: bold;">- ${discountAmountFormatted}</td>
      </tr>
      <tr>
        <td style="color: #374151; padding: 6px 0;">Porcentagem do desconto:</td>
        <td style="text-align: right; color: #1f2937;">${couponSummary!.discount_percent}%</td>
      </tr>
      <tr>
        <td style="color: #374151; font-weight: bold; font-size: 16px; padding: 8px 0;">Total pago:</td>
        <td style="text-align: right; color: #5E2C7E; font-weight: bold; font-size: 20px;">${finalTotalFormatted}</td>
      </tr>
    ` : `
      <tr>
        <td style="color: #374151; font-weight: bold; font-size: 16px; padding: 8px 0;">Total:</td>
        <td style="text-align: right; color: #5E2C7E; font-weight: bold; font-size: 20px;">${totalFormatted}</td>
      </tr>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmação de Compra - Musical em Bom Português</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #5E2C7E; padding: 40px 20px; text-align: center;">
                  <!--[if mso]>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                  <td align="center">
                  <![endif]-->
                  <div style="display: inline-block; max-width: 600px; width: 100%;">
                    <img src="https://hlrcvvaneofcpncbqjyg.supabase.co/storage/v1/object/public/logotipo-email//logo-branco.png" 
                         alt="Musical em Bom Português - Logo" 
                         width="269" height="269"
                         style="height: 269px; width: 269px; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto; border: 0; outline: none; text-decoration: none;" />
                    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px; font-family: Arial, sans-serif;">Sua compra foi confirmada!</p>
                  </div>
                  <!--[if mso]>
                  </td>
                  </tr>
                  </table>
                  <![endif]-->
                </td>
              </tr>
              
              <!-- Saudação -->
              <tr>
                <td style="padding: 30px 20px;">
                  <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Olá, ${userName}! 👋</h2>
                  <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Obrigado por sua compra! Seu pagamento foi processado com sucesso e você já tem acesso às suas novas versões.
                  </p>
                </td>
              </tr>
              
              <!-- Itens Comprados -->
              <tr>
                <td style="padding: 0 20px 20px 20px;">
                  <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-weight: bold;">
                    📦 Itens Comprados:
                  </h3>
                  ${itemsHTML}
                </td>
              </tr>
              
              <!-- Resumo do Pedido -->
              <tr>
                <td style="padding: 20px; background-color: #f0f9ff; border: 2px solid #0ea5e9;">
                  <h3 style="color: #0c4a6e; margin: 0 0 16px 0; font-size: 18px; font-weight: bold;">
                    💳 Resumo do Pedido
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color: #374151; font-weight: bold; padding: 8px 0;">ID do Pagamento:</td>
                      <td style="text-align: right; font-family: 'Courier New', monospace; color: #1f2937; font-weight: bold; background-color: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 14px;">${paymentId}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="border-top: 2px solid #0ea5e9; padding-top: 16px;"></td>
                    </tr>
                    ${summaryRows}
                  </table>
                </td>
              </tr>
              
              <!-- Botão Meus Pedidos -->
              <tr>
                <td style="padding: 30px 20px; text-align: center;">
                  <a href="https://musicalembomportugues.com.br/meus-pedidos" 
                     style="display: inline-block; background-color: #059669; color: white; padding: 16px 32px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
                    📋 Meus Pedidos
                  </a>
                </td>
              </tr>
              
              <!-- Próximos Passos -->
              <tr>
                <td style="padding: 20px; background-color: #fef3c7; border: 2px solid #f59e0b;">
                  <h3 style="color: #92400e; margin: 0 0 16px 0; font-size: 18px; font-weight: bold;">
                    🎯 Próximos Passos
                  </h3>
                  <ul style="margin: 0; padding-left: 24px; color: #78350f; line-height: 1.8;">
                    <li style="margin-bottom: 8px; font-weight: bold; color: #78350f;">Você receberá em breve um e-mail de confirmação com os detalhes da compra e o arquivo PDF da versão. Lembre-se de procurar na caixa de spam.</li>
                    <li style="margin-bottom: 8px; font-weight: bold;">Baixe os PDFs usando os botões destacados acima</li>
                    <li style="font-weight: bold;">Confira outras versões disponíveis em nosso catálogo</li>
                  </ul>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 20px; text-align: center; border-top: 2px solid #e5e7eb; background-color: #ffffff;">
                  <!--[if mso]>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                  <td align="center">
                  <![endif]-->
                  <div style="display: inline-block; max-width: 600px; width: 100%;">
                    <img src="https://hlrcvvaneofcpncbqjyg.supabase.co/storage/v1/object/public/logotipo-email//Roxo%20-%20Logo.png" 
                         alt="Musical em Bom Português - Logo" 
                         width="269" height="269"
                         style="height: 269px; width: 269px; margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto; border: 0; outline: none; text-decoration: none;" />
                    <p style="margin: 0 0 8px 0; color: #5E2C7E; font-size: 16px; font-weight: bold; font-family: Arial, sans-serif;">Obrigado por escolher o Musical em Bom Português! 🎵</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px; font-family: Arial, sans-serif;">Em caso de dúvidas, entre em contato conosco pelo e-mail rafoliveira@gmail.com ou pelo WhatsApp no (11) 94649-3583.</p>
                  </div>
                  <!--[if mso]>
                  </td>
                  </tr>
                  </table>
                  <![endif]-->
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Função para gerar HTML simples do e-mail
const generateSimpleEmailHTML = (userName: string, message: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Teste - Musical em Bom Português</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #5E2C7E; padding: 40px 20px; text-align: center;">
                  <!--[if mso]>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                  <td align="center">
                  <![endif]-->
                  <div style="display: inline-block; max-width: 600px; width: 100%;">
                    <img src="https://hlrcvvaneofcpncbqjyg.supabase.co/storage/v1/object/public/logotipo-email//logo-branco.png" 
                         alt="Musical em Bom Português - Logo" 
                         width="269" height="269"
                         style="height: 269px; width: 269px; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto; border: 0; outline: none; text-decoration: none;" />
                    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px; font-family: Arial, sans-serif;">E-mail de Teste</p>
                  </div>
                  <!--[if mso]>
                  </td>
                  </tr>
                  </table>
                  <![endif]-->
                </td>
              </tr>
              
              <!-- Conteúdo -->
              <tr>
                <td style="padding: 30px 20px;">
                  <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Olá, ${userName}! 👋</h2>
                  <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    ${message}
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 20px; text-align: center; border-top: 2px solid #e5e7eb; background-color: #ffffff;">
                  <!--[if mso]>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                  <td align="center">
                  <![endif]-->
                  <div style="display: inline-block; max-width: 600px; width: 100%;">
                    <img src="https://hlrcvvaneofcpncbqjyg.supabase.co/storage/v1/object/public/logotipo-email//Roxo%20-%20Logo.png" 
                         alt="Musical em Bom Português - Logo" 
                         width="269" height="269"
                         style="height: 269px; width: 269px; margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto; border: 0; outline: none; text-decoration: none;" />
                    <p style="margin: 0 0 8px 0; color: #5E2C7E; font-size: 16px; font-weight: bold; font-family: Arial, sans-serif;">Este é um e-mail de teste do Musical em Bom Português! 🎵</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px; font-family: Arial, sans-serif;">Em caso de dúvidas, entre em contato conosco pelo e-mail rafoliveira@gmail.com ou pelo WhatsApp no (11) 94649-3583.</p>
                  </div>
                  <!--[if mso]>
                  </td>
                  </tr>
                  </table>
                  <![endif]-->
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Handler principal da função
export const onRequestPost = async (context: { request: Request; env: any }) => {
  // Headers CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    // Verificar variáveis de ambiente
    const resendApiKey = context.env.RESEND_API_KEY;
    const supabaseUrl = context.env.SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_ANON_KEY;

    if (!resendApiKey) {
      return new Response(JSON.stringify({ 
        error: 'RESEND_API_KEY não configurada',
        debug: 'Verifique se a variável de ambiente RESEND_API_KEY está configurada no Cloudflare Pages'
      }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({
        error: 'Configurações do Supabase não encontradas'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    // Parse do body da requisição
    const emailData: EmailRequest = await context.request.json();
    let { userEmail, userName, cartItems, paymentId, totalAmount, subject, message } = emailData;
    
    // Se não há cartItems na requisição, tentar obter do storage
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      const storageCartData = getCartData(context);
      if (storageCartData && storageCartData.length > 0) {
        cartItems = storageCartData;
        console.log('📦 [send-email] Usando dados do carrinho do storage');
      }
    }

    console.log('📧 [send-email] Dados recebidos:', {
      userEmail: userEmail ? '***@***.***' : 'não fornecido',
      userName,
      hasCartItems: !!cartItems,
      cartItemsLength: cartItems?.length || 0,
      paymentId,
      totalAmount,
      subject,
      hasMessage: !!message,
      cartItemsDetailed: cartItems?.map(item => ({
        id: item?.id,
        title: item?.title,
        price: item?.price,
        image: item?.image,
        artist: item?.artist,
        category: item?.category
      })) || []
    });

    // Validar dados obrigatórios
    if (!userEmail || !userName) {
      return new Response(JSON.stringify({ 
        error: 'userEmail e userName são obrigatórios',
        received: { userEmail, userName }
      }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    let emailHTML: string;
    let emailSubject: string;

    // Verificar se é um e-mail de confirmação de compra ou um e-mail simples
    if (Array.isArray(cartItems) && cartItems.length > 0 && paymentId && totalAmount) {
      console.log('✅ [send-email] Condições para e-mail de compra atendidas');
      // E-mail de confirmação de compra
      try {
        // Extrair IDs dos versos do carrinho
        const verseIds: string[] = cartItems.map(item => String(item.id)).filter((id: string) => id && !isNaN(Number(id)));
        
        if (verseIds.length === 0) {
          throw new Error('Nenhum ID de verso válido encontrado no carrinho');
        }
        
        // Buscar dados completos dos versos
        const verses = await fetchVerseDetails(verseIds, supabaseUrl, supabaseKey);
        
        if (verses.length === 0) {
          throw new Error('Não foi possível obter dados dos versos');
        }
        
        // Extrair resumo do cupom (se houver) a partir de qualquer item do carrinho
        let couponSummary: { original_total: number; discount_amount: number; discount_percent: number; final_total: number; code?: string } | undefined;
        try {
          const itemWithCoupon = (cartItems as any[]).find((it) => it && it.coupon);
          if (itemWithCoupon?.coupon) {
            const { original_total, discount_amount, discount_percent, final_total, code } = itemWithCoupon.coupon;
            if (
              typeof original_total === 'number' &&
              typeof discount_amount === 'number' &&
              typeof discount_percent === 'number' &&
              typeof final_total === 'number'
            ) {
              couponSummary = { original_total, discount_amount, discount_percent, final_total, code };
            }
          }
        } catch (e) {
          console.warn('[send-email] Falha ao extrair dados do cupom do carrinho:', e);
        }
        
        // Novo: obter informações de pagamento no Mercado Pago para detalhar resumo (cartão de crédito/débito)
        let paymentInfo: { method: 'credit' | 'debit' | 'pix' | 'other'; installments?: number; totalPaid?: number; perInstallment?: number } | undefined;
        const baseTotal = verses.reduce((sum, v) => sum + (typeof v.valor === 'number' ? v.valor : 0), 0);
        try {
          const MP_ACCESS_TOKEN: string | undefined = context.env.MP_ACCESS_TOKEN;
          if (MP_ACCESS_TOKEN && paymentId) {
            const upstream = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
              headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
            });
            const text = await upstream.text();
            const mp: any = text ? (() => { try { return JSON.parse(text); } catch { return { raw: text }; } })() : {};
            const type = mp?.payment_type_id as string | undefined;
            const method: 'credit' | 'debit' | 'pix' | 'other' = type === 'credit_card' ? 'credit' : type === 'debit_card' ? 'debit' : type === 'pix' ? 'pix' : 'other';
            const installments = typeof mp?.installments === 'number' ? mp.installments : undefined;
            const totalPaidRaw = (mp?.transaction_details?.total_paid_amount ?? mp?.transaction_amount);
            const totalPaid = typeof totalPaidRaw === 'number' ? totalPaidRaw : undefined;
            const perInstallment = (typeof installments === 'number' && installments > 1 && typeof totalPaid === 'number') ? (totalPaid / installments) : undefined;
            paymentInfo = { method, installments, totalPaid, perInstallment };
            console.log('💳 [send-email] paymentInfo obtido do MP:', paymentInfo);
          }
        } catch (err) {
          console.warn('⚠️ [send-email] Falha ao obter detalhes do pagamento no MP:', err);
        }
        
        // Gerar HTML do e-mail de confirmação de compra
        emailHTML = generatePurchaseEmailHTML(
          userName,
          verses,
          paymentId,
          totalAmount,
          couponSummary,
          paymentInfo,
          baseTotal
        );
        
        emailSubject = 'Confirmação de Compra - Musical em Bom Português';
        
      } catch (error) {
        console.error('Erro ao gerar e-mail de confirmação:', error);
        return new Response(JSON.stringify({
          error: 'Erro ao gerar e-mail de confirmação',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    } else {
      // E-mail simples (teste)
      emailSubject = subject || 'Teste';
      const emailMessage = message || 'Este é um e-mail de teste.';
      emailHTML = generateSimpleEmailHTML(userName, emailMessage);
    }
    
    // Enviar e-mail
    const emailResult = await sendEmail(userEmail, emailSubject, emailHTML, resendApiKey);

    console.log('✅ E-mail enviado com sucesso:', emailResult.id);
    
    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResult.id,
      message: 'E-mail enviado com sucesso!'
    }), { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      debug: 'Verifique os logs do Cloudflare Pages para mais detalhes'
    }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
};

// Handler para requisições OPTIONS (CORS preflight)
export const onRequestOptions = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};