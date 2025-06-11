import { supabase } from '@/integrations/supabase/client';

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

/**
 * Registra uma nova compra
 */
export const createPurchase = async (
  userId: string,
  items: PurchaseItem[],
  paymentMethod: string,
  paymentId?: string
): Promise<string | null> => {
  try {
    console.log('🛒 [purchaseService] Criando compra:', { userId, items, paymentMethod });
    
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
    
    // Buscar as compras antes de atualizar para conceder acesso às versões irmãs
    const { data: purchases, error: fetchError } = await supabase
      .from('user_purchases')
      .select('user_id, verse_id, payment_method')
      .eq('payment_id', paymentId)
      .eq('payment_status', 'pending');
    
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
    
    // Se a compra foi concluída com sucesso, conceder acesso às versões irmãs
    if (status === 'completed' && purchases && purchases.length > 0) {
      for (const purchase of purchases) {
        await grantAccessToSiblingVerses(
          purchase.user_id,
          purchase.verse_id,
          purchase.payment_method,
          paymentId
        );
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