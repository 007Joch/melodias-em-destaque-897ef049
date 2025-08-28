
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartItem {
  id: string;
  title: string;
  artist: string;
  category: string;
  image?: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getExtendedCartData: () => CartItem[] | null;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  // Novas APIs para controlar etapa inicial do checkout
  initialCheckoutStep: CheckoutStep | null;
  setInitialCheckoutStep: (step: CheckoutStep | null) => void;
  openCartToStep: (step: CheckoutStep) => void;
}

// Novo tipo para etapas do checkout
export type CheckoutStep = 'cart' | 'address' | 'payment' | 'success';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Carregar itens do localStorage na inicialização
    try {
      const savedItems = localStorage.getItem('cart-items');
      const parsedItems = savedItems ? JSON.parse(savedItems) : [];
      console.log('🛒 [CartProvider] Carregando carrinho do localStorage:', parsedItems);
      return parsedItems;
    } catch (error) {
      console.error('❌ [CartProvider] Erro ao carregar carrinho do localStorage:', error);
      return [];
    }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Estado para etapa inicial do checkout quando abrir o carrinho
  const [initialCheckoutStep, setInitialCheckoutStep] = useState<CheckoutStep | null>(null);
  
  const openCart = () => {
    setIsCartOpen(true);
  };

  // Abrir carrinho diretamente em uma etapa específica
  const openCartToStep = (step: CheckoutStep) => {
    setInitialCheckoutStep(step);
    setIsCartOpen(true);
  };
  
  // Verificação adicional para garantir sincronização com localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart-items') {
        try {
          const newItems = e.newValue ? JSON.parse(e.newValue) : [];
          console.log('🔄 [CartProvider] Sincronizando carrinho com mudança no localStorage:', newItems);
          setItems(newItems);
        } catch (error) {
          console.error('❌ [CartProvider] Erro ao sincronizar carrinho:', error);
          setItems([]);
        }
      }
    };
    
    const handleCartCleared = () => {
      console.log('🔄 [CartProvider] Evento de carrinho limpo detectado, forçando re-renderização');
      setItems([]);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cart-cleared', handleCartCleared);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cart-cleared', handleCartCleared);
    };
  }, []);

  // Salvar itens no localStorage sempre que o estado mudar
  useEffect(() => {
    try {
      localStorage.setItem('cart-items', JSON.stringify(items));
      console.log('💾 [CartProvider] Carrinho salvo no localStorage:', items);
    } catch (error) {
      console.error('❌ [CartProvider] Erro ao salvar carrinho no localStorage:', error);
    }
  }, [items]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    // Validar dados do item antes de adicionar
    if (!item.title || item.title.trim() === '') {
      console.error('❌ [CartProvider] Tentativa de adicionar item sem título válido:', item);
      return;
    }
    
    console.log('➕ [CartProvider] Adicionando item ao carrinho:', item);
    
    setItems(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        console.log('⚠️ [CartProvider] Item já existe no carrinho, ignorando duplicata:', item.id);
        return prev;
      }
      
      const newItems = [...prev, { ...item, quantity: 1 }];
      console.log('✅ [CartProvider] Item adicionado com sucesso. Carrinho atualizado:', newItems);
      return newItems;
    });
  };

  const removeFromCart = (id: string) => {
    console.log('🗑️ [CartProvider] Removendo item do carrinho:', id);
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== id);
      console.log('✅ [CartProvider] Item removido. Carrinho atualizado:', newItems);
      return newItems;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    console.log('🧹 [CartProvider] Limpando carrinho. Itens atuais:', items);
    
    // Antes de limpar o carrinho, salvar os dados para persistência estendida
    // Isso permite que o webhook do Mercado Pago acesse os dados mesmo após a limpeza
    try {
      if (items.length > 0) {
        const extendedData = {
          items: items,
          timestamp: Date.now(),
          // Manter por 30 minutos (tempo suficiente para o webhook processar)
          expiresAt: Date.now() + (30 * 60 * 1000)
        };
        localStorage.setItem('cart-extended-data', JSON.stringify(extendedData));
        console.log('💾 [CartProvider] Dados do carrinho salvos para persistência estendida:', extendedData);
      }
    } catch (error) {
      console.error('❌ [CartProvider] Erro ao salvar dados estendidos do carrinho:', error);
    }

    // Limpar o estado primeiro
    setItems([]);
    
    // Forçar uma atualização do localStorage após limpar o estado
    try {
      localStorage.removeItem('cart-items');
      // Garantir que o localStorage seja atualizado imediatamente
      localStorage.setItem('cart-items', JSON.stringify([]));
      localStorage.removeItem('cart-items');
      console.log('✅ [CartProvider] Carrinho limpo com sucesso');
      
      // Disparar evento customizado para forçar re-renderização
      window.dispatchEvent(new CustomEvent('cart-cleared'));
    } catch (error) {
      console.error('❌ [CartProvider] Erro ao limpar carrinho do localStorage:', error);
    }
  };

  const getItemCount = () => {
    return items.length;
  };

  const getTotalItems = () => {
    return items.length; // Cada verso é único, então o total é o número de itens
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price, 0); // Sem multiplicar por quantidade
  };

  const getExtendedCartData = (): CartItem[] | null => {
    try {
      const extendedDataStr = localStorage.getItem('cart-extended-data');
      if (!extendedDataStr) {
        return null;
      }

      const extendedData = JSON.parse(extendedDataStr);
      const now = Date.now();

      // Verificar se os dados expiraram
      if (now > extendedData.expiresAt) {
        console.log('🗑️ [useCart] Dados estendidos expiraram, removendo...');
        localStorage.removeItem('cart-extended-data');
        return null;
      }

      console.log('📦 [useCart] Recuperando dados estendidos do carrinho:', extendedData.items);
      return extendedData.items;
    } catch (error) {
      console.error('Erro ao recuperar dados estendidos do carrinho:', error);
      return null;
    }
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getItemCount,
      getTotalItems,
      getTotalPrice,
      getExtendedCartData,
      isCartOpen,
      setIsCartOpen,
      openCart,
      initialCheckoutStep,
      setInitialCheckoutStep,
      openCartToStep,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
