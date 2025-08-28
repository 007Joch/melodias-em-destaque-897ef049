import { supabase } from '../integrations/supabase/client';
import { sendPurchaseConfirmationEmail } from './emailService';

// E-mail agora é processado via Cloudflare Pages Function

export interface Purchase {
  id: string;
  user_id: string;
  verse_id: number;
  amount: number;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_id?: string;
  created_at: string;
}

export interface PurchaseItem {
  verse_id: number;
  amount: number;
}

/**
 * Verifica se um usuário já comprou um verso específico
 */
export const hasUserPurchasedVerse = async (userId: string, verseId: number): Promise<boolean> => {
  try {
    console.log('🔍 [purchaseService] Verificando compra:', { userId, verseId });
    
    const { data, error } = await supabase
      .from('user_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('verse_id', verseId)
      .eq('payment_status', 'completed')
      .limit(1);
    
    if (error) {
      console.error('❌ [purchaseService] Erro ao verificar compra:', error);
      return false;
    }
    
    const hasPurchased = data && data.length > 0;
    console.log('✅ [purchaseService] Resultado da verificação:', { hasPurchased });
    
    return hasPurchased;
  } catch (error) {
    console.error('❌ [purchaseService] Erro ao verificar compra:', error);
    return false;
  }
};

/**
 * Obtém todas as compras de um usuário
 */
export const getUserPurchases = async (userId: string): Promise<number[]> => {
  try {
    console.log('🔍 [purchaseService] Buscando compras do usuário:', userId);
    
    const { data, error } = await supabase
      .from('user_purchases')
      .select('verse_id')
      .eq('user_id', userId)
      .eq('payment_status', 'completed');
    
    if (error) {
      console.error('❌ [purchaseService] Erro ao buscar compras:', error);
      return [];
    }
    
    const verseIds = data?.map(purchase => purchase.verse_id) || [];
    console.log('✅ [purchaseService] Compras encontradas:', verseIds);
    
    return verseIds;
  } catch (error) {
    console.error('❌ [purchaseService] Erro ao buscar compras:', error);
    return [];
  }
};

// Armazenamento temporário dos dados do carrinho para o webhook
// Agora com persistência estendida para garantir que o webhook tenha acesso aos dados
interface CartDataEntry {
  items: any[];
  timestamp: number;
  expiresAt: number;
}

const cartDataStorage = new Map<string, CartDataEntry>();

// Função para limpar dados expirados automaticamente
const cleanupExpiredCartData = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [paymentId, entry] of cartDataStorage.entries()) {
    if (now > entry.expiresAt) {
      cartDataStorage.delete(paymentId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 [purchaseService] Limpeza automática: ${cleanedCount} entradas expiradas removidas`);
  }
};

// Executar limpeza a cada 10 minutos
setInterval(cleanupExpiredCartData, 10 * 60 * 1000);

/**
 * Registra uma nova compra
 */
export const createPurchase = async (
  userId: string,
  items: PurchaseItem[],
  paymentMethod: string,
  paymentId?: string,
  cartItems?: any[]
): Promise<string | null> => {
  try {
    console.log('🛒 [purchaseService] Criando compra:', { userId, items, paymentMethod });
    
    // Armazenar dados do carrinho se fornecidos com persistência estendida
    if (cartItems && paymentId) {
      const cartEntry: CartDataEntry = {
        items: cartItems,
        timestamp: Date.now(),
        // Manter por 45 minutos (tempo estendido para garantir que o webhook processe)
        expiresAt: Date.now() + (45 * 60 * 1000)
      };
      cartDataStorage.set(paymentId, cartEntry);
      console.log('💾 [purchaseService] Dados do carrinho armazenados com persistência estendida:', {
        paymentId,
        itemsCount: cartItems.length,
        expiresAt: new Date(cartEntry.expiresAt).toISOString()
      });
    }
    
    // Criar registros de compra para cada item
    const purchases = items.map(item => ({
      user_id: userId,
      verse_id: item.verse_id,
      amount: item.amount,
      payment_method: paymentMethod,
      payment_status: 'pending' as const,
      payment_id: paymentId,
      created_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from('user_purchases')
      .insert(purchases)
      .select('id');
    
    if (error) {
      console.error('❌ [purchaseService] Erro ao criar compra:', error);
      return null;
    }
    
    const purchaseId = data?.[0]?.id;
    console.log('✅ [purchaseService] Compra criada:', purchaseId);
    
    return purchaseId;
  } catch (error) {
    console.error('❌ [purchaseService] Erro ao criar compra:', error);
    return null;
  }
};

/**
 * Registra acesso às versões irmãs quando uma compra é concluída
 */
export const grantAccessToSiblingVerses = async (
  userId: string,
  verseId: number,
  paymentMethod: string,
  paymentId?: string
): Promise<void> => {
  try {
    console.log('🔗 [purchaseService] Concedendo acesso às versões irmãs:', { userId, verseId });
    
    // Buscar versões irmãs do verso comprado
    const { data: verse, error: verseError } = await supabase
      .from('versoes')
      .select('versoes_irmas')
      .eq('id', verseId)
      .single();
    
    if (verseError || !verse?.versoes_irmas || verse.versoes_irmas.length === 0) {
      console.log('📝 [purchaseService] Verso não tem versões irmãs para liberar');
      return;
    }
    
    // Criar registros de "compra" para as versões irmãs com valor 0
    const siblingPurchases = verse.versoes_irmas.map(siblingId => ({
      user_id: userId,
      verse_id: siblingId,
      amount: 0, // Valor 0 indica que foi liberado via versão irmã
      payment_method: `sibling_access_from_${verseId}`,
      payment_status: 'completed' as const,
      payment_id: paymentId,
      created_at: new Date().toISOString()
    }));
    
    // Verificar quais versões irmãs o usuário ainda não possui
    const existingPurchases = await getUserPurchases(userId);
    const newSiblingPurchases = siblingPurchases.filter(
      purchase => !existingPurchases.includes(purchase.verse_id)
    );
    
    if (newSiblingPurchases.length > 0) {
      const { error: insertError } = await supabase
        .from('user_purchases')
        .insert(newSiblingPurchases);
      
      if (insertError) {
        console.error('❌ [purchaseService] Erro ao conceder acesso às versões irmãs:', insertError);
      } else {
        console.log('✅ [purchaseService] Acesso concedido às versões irmãs:', newSiblingPurchases.map(p => p.verse_id));
      }
    } else {
      console.log('📝 [purchaseService] Usuário já possui acesso a todas as versões irmãs');
    }
  } catch (error) {
    console.error('❌ [purchaseService] Erro ao conceder acesso às versões irmãs:', error);
  }
};

/**
 * Atualiza o status de uma compra
 */
export const updatePurchaseStatus = async (
  paymentId: string,
  status: 'completed' | 'failed'
): Promise<boolean> => {
  try {
    console.log('🔄 [purchaseService] Atualizando status da compra:', { paymentId, status });
    
    // Buscar as compras antes de atualizar para conceder acesso às versões irmãs e enviar e-mail
    const { data: purchases, error: fetchError } = await supabase
      .from('user_purchases')
      .select(`
        user_id, 
        verse_id, 
        payment_method, 
        amount
      `)
      .eq('payment_id', paymentId)
      .eq('payment_status', 'pending');

    // Buscar dados do usuário (email e nome) separadamente
    let userEmail = '';
    let userName = '';
    
    if (purchases && purchases.length > 0) {
      const userId = purchases[0].user_id;
      
      // Buscar nome do usuário
      const { data: userInfo, error: userInfoError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();
      
      if (!userInfoError && userInfo) {
        userName = userInfo.name;
      }
      
      // Buscar e-mail do usuário usando a função SQL
      const { data: emailData, error: emailError } = await supabase
        .rpc('get_user_email', { user_uuid: userId });
      
      if (!emailError && emailData) {
        userEmail = emailData;
      }
      
      console.log('👤 [purchaseService] Dados do usuário:', {
        userId,
        userName,
        userEmail: userEmail ? '***@***.***' : 'não encontrado'
      });
    }
    
    if (fetchError) {
      console.error('❌ [purchaseService] Erro ao buscar compras:', fetchError);
      return false;
    }
    
    const { error } = await supabase
      .from('user_purchases')
      .update({ payment_status: status })
      .eq('payment_id', paymentId);
    
    if (error) {
      console.error('❌ [purchaseService] Erro ao atualizar status:', error);
      return false;
    }
    
    // Se a compra foi concluída com sucesso
    if (status === 'completed' && purchases && purchases.length > 0) {
      // Conceder acesso às versões irmãs
      for (const purchase of purchases) {
        await grantAccessToSiblingVerses(
          purchase.user_id,
          purchase.verse_id,
          purchase.payment_method,
          paymentId
        );
      }
      
      // Enviar e-mail de confirmação
      try {
        if (userEmail) {
          const verseIds = purchases.map(p => p.verse_id);
          const totalAmount = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
          
          // Os dados dos versos e geração do HTML são processados na Cloudflare Pages Function

          console.log('📧 [purchaseService] Enviando e-mail de confirmação:', {
            userEmail,
            userName,
            verseIds,
            paymentId,
            totalAmount
          });
          
          console.log('📧 [purchaseService] Enviando e-mail de confirmação para:', userEmail);
          
          // Recuperar dados do carrinho armazenados com verificação de expiração
          let cartItems: any[] = [];
          const cartEntry = cartDataStorage.get(paymentId);
          
          if (cartEntry) {
            const now = Date.now();
            if (now <= cartEntry.expiresAt) {
              cartItems = cartEntry.items;
              console.log('📦 [purchaseService] Dados do carrinho recuperados com sucesso:', {
                paymentId,
                itemsCount: cartItems.length,
                timeRemaining: Math.round((cartEntry.expiresAt - now) / 1000 / 60) + ' minutos'
              });
            } else {
              console.log('⏰ [purchaseService] Dados do carrinho expiraram:', {
                paymentId,
                expiredAt: new Date(cartEntry.expiresAt).toISOString()
              });
              cartDataStorage.delete(paymentId);
            }
          } else {
            console.log('⚠️ [purchaseService] Nenhum dado do carrinho encontrado para:', paymentId);
          }
          
          // Log detalhado dos dados recuperados
          if (cartItems.length > 0) {
            console.log('📦 [purchaseService] Dados detalhados do carrinho:', {
              paymentId,
              cartItemsCount: cartItems.length,
              cartItems: cartItems.map(item => ({ id: item.id, title: item.title, price: item.price }))
            });
          }
          
          // Chamar o serviço de e-mail (Cloudflare Pages Function)
          const emailSent = await sendPurchaseConfirmationEmail(
            userEmail,
            userName,
            cartItems,
            paymentId,
            totalAmount
          );
          
          if (!emailSent) {
            console.error('❌ [purchaseService] Falha ao enviar e-mail de confirmação');
            // Manter dados do carrinho para nova tentativa
            console.log('🔄 [purchaseService] Mantendo dados do carrinho para possível nova tentativa');
          } else {
            console.log('✅ [purchaseService] E-mail enviado com sucesso');
            
            // Limpar dados do carrinho apenas após sucesso do e-mail
            // Mas manter por mais alguns minutos como backup
            if (cartItems.length > 0) {
              setTimeout(() => {
                cartDataStorage.delete(paymentId);
                console.log('🗑️ [purchaseService] Dados do carrinho removidos da memória após delay de segurança');
              }, 5 * 60 * 1000); // 5 minutos de delay
              
              console.log('⏰ [purchaseService] Dados do carrinho serão removidos em 5 minutos');
            }
          }
        } else {
          console.warn('⚠️ [purchaseService] E-mail do usuário não encontrado para envio de confirmação');
        }
      } catch (emailError) {
        console.error('❌ [purchaseService] Erro ao enviar e-mail de confirmação:', emailError);
        // Não falhar a operação se o e-mail não for enviado
      }
    }
    
    console.log('✅ [purchaseService] Status atualizado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [purchaseService] Erro ao atualizar status:', error);
    return false;
  }
};

/**
 * Verifica se um usuário tem acesso a um verso (comprou ou tem permissão especial)
 * Inclui lógica de versões irmãs: se comprou uma versão, tem acesso às versões irmãs
 */
export const hasAccessToVerse = async (userId: string | null, verseId: number, userRole?: string): Promise<boolean> => {
  // Usuários admin e membros têm acesso total
  if (userRole === 'admin' || userRole === 'membro') {
    return true;
  }
  
  // Usuários não logados não têm acesso
  if (!userId) {
    return false;
  }
  
  // Verificar se o usuário comprou o verso diretamente
  const hasPurchasedDirectly = await hasUserPurchasedVerse(userId, verseId);
  if (hasPurchasedDirectly) {
    return true;
  }
  
  // Verificar se o usuário comprou alguma versão irmã
  return await hasAccessThroughSiblingVerses(userId, verseId);
};

/**
 * Verifica se o usuário tem acesso através de versões irmãs
 */
export const hasAccessThroughSiblingVerses = async (userId: string, verseId: number): Promise<boolean> => {
  try {
    console.log('🔍 [purchaseService] Verificando acesso via versões irmãs:', { userId, verseId });
    
    // Buscar o verso para obter suas versões irmãs
    const { data: verse, error: verseError } = await supabase
      .from('versoes')
      .select('versoes_irmas')
      .eq('id', verseId)
      .single();
    
    if (verseError || !verse?.versoes_irmas || verse.versoes_irmas.length === 0) {
      console.log('📝 [purchaseService] Verso não tem versões irmãs');
      return false;
    }
    
    // Verificar se o usuário comprou alguma das versões irmãs
    for (const siblingId of verse.versoes_irmas) {
      const hasPurchasedSibling = await hasUserPurchasedVerse(userId, siblingId);
      if (hasPurchasedSibling) {
        console.log('✅ [purchaseService] Acesso liberado via versão irmã:', siblingId);
        return true;
      }
    }
    
    // Verificar se alguma versão irmã tem este verso como irmã (relação bidirecional)
    const { data: siblingVerses, error: siblingError } = await supabase
      .from('versoes')
      .select('id, versoes_irmas')
      .in('id', verse.versoes_irmas);
    
    if (siblingError) {
      console.error('❌ [purchaseService] Erro ao buscar versões irmãs:', siblingError);
      return false;
    }
    
    for (const siblingVerse of siblingVerses || []) {
      if (siblingVerse.versoes_irmas?.includes(verseId)) {
        const hasPurchasedSibling = await hasUserPurchasedVerse(userId, siblingVerse.id);
        if (hasPurchasedSibling) {
          console.log('✅ [purchaseService] Acesso liberado via versão irmã bidirecional:', siblingVerse.id);
          return true;
        }
      }
    }
    
    console.log('❌ [purchaseService] Nenhuma versão irmã foi comprada');
    return false;
  } catch (error) {
    console.error('❌ [purchaseService] Erro ao verificar acesso via versões irmãs:', error);
    return false;
  }
};