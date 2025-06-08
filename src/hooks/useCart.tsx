
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CartItem {
  id: string;
  title: string;
  artist: string;
  category: string;
  image?: string;
  price: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setItems(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        return prev; // Item já existe, não adiciona duplicado
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemCount = () => {
    return items.length;
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      clearCart,
      getItemCount,
      getTotalPrice
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
