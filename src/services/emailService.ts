// Serviço de e-mail usando Cloudflare Pages Functions

import { DEFAULT_VERSE_IMAGE } from '@/constants/images';

interface PurchaseItem {
  id: number;
  titulo_original: string;
  titulo_pt_br: string;
  musical: string;
  url_imagem: string;
  classificacao_vocal_alt: string[];
  pdf: string;
  valor: number;
}

interface EmailData {
  userEmail: string;
  userName: string;
  items: PurchaseItem[];
  paymentId: string;
  totalAmount: number;
}

// A busca dos dados dos versos agora é feita na Cloudflare Pages Function

/**
 * Gera o HTML do e-mail de confirmação de compra
 */
const generatePurchaseEmailHTML = (data: EmailData): string => {
  const { userName, items, paymentId, totalAmount } = data;
  
  const itemsHTML = items.map(item => {
    const imageUrl = item.url_imagem || DEFAULT_VERSE_IMAGE;
    const classifications = item.classificacao_vocal_alt?.join(', ') || 'Não especificado';
    const title = item.titulo_original || '';
    const price = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(item.valor || 0);
    
    return `
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; background-color: #ffffff;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <img src="${imageUrl}" alt="${title}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;" />
          <div style="flex: 1;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600;">${title}</h3>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${item.musical}</p>
            <div style="margin-bottom: 12px;">
              <span style="background-color: #f3e8ff; color: #7c3aed; padding: 4px 8px; border-radius: 16px; font-size: 12px; font-weight: 500;">
                ${classifications}
              </span>
            </div>
            <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 16px;">${price}</p>
          </div>
        </div>
        ${item.pdf ? `
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <a href="${item.pdf}" 
               style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;"
               target="_blank">
              📄 Baixar PDF
            </a>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
  
  const totalFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(totalAmount);
  
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmação de Compra - Musical em Bom Português</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🎭 Musical em Bom Português</h1>
        <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Sua compra foi confirmada!</p>
      </div>
      
      <div style="background-color: #f9fafb; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Olá, ${userName}! 👋</h2>
        <p style="margin: 0; color: #4b5563; font-size: 16px;">
          Obrigado por sua compra! Seu pagamento foi processado com sucesso e você já tem acesso aos seus novos versos.
        </p>
      </div>
      
      <div style="margin-bottom: 24px;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">📦 Itens Comprados:</h3>
        ${itemsHTML}
      </div>
      
      <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #0c4a6e; margin: 0 0 12px 0; font-size: 16px;">💳 Resumo do Pedido</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #374151;">ID do Pagamento:</span>
          <span style="font-family: monospace; color: #1f2937; font-weight: 500;">${paymentId}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #0ea5e9;">
          <span style="color: #374151; font-weight: 600;">Total:</span>
          <span style="color: #1f2937; font-weight: 700; font-size: 18px;">${totalFormatted}</span>
        </div>
      </div>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px;">🎯 Próximos Passos</h3>
        <ul style="margin: 0; padding-left: 20px; color: #78350f;">
          <li>Acesse sua conta no site para visualizar seus versos</li>
          <li>Baixe os PDFs usando os links acima</li>
          <li>Explore outros versos em nosso catálogo</li>
        </ul>
      </div>
      
      <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p style="margin: 0 0 8px 0;">Obrigado por escolher o Musical em Bom Português! 🎵</p>
        <p style="margin: 0;">Em caso de dúvidas, entre em contato conosco.</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Envia e-mail de confirmação de compra usando Cloudflare Pages Function
 */
export const sendPurchaseConfirmationEmail = async (
  userEmail: string,
  userName: string,
  cartItems: any[],
  paymentId: string,
  totalAmount: number
): Promise<boolean> => {
  try {
    console.log('📧 [emailService] Enviando e-mail de confirmação via Cloudflare Pages:', {
      userEmail,
      userName,
      cartItems,
      paymentId,
      totalAmount
    });
    
    // Chamar a Cloudflare Pages Function
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userEmail,
        userName,
        cartItems,
        paymentId,
        totalAmount
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      console.error('❌ [emailService] Erro ao enviar e-mail:', errorData);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ [emailService] E-mail enviado com sucesso:', result.emailId);
    return true;
  } catch (error) {
    console.error('❌ [emailService] Erro ao enviar e-mail:', error);
    return false;
  }
};

export { generatePurchaseEmailHTML };

export default {
  sendPurchaseConfirmationEmail
};