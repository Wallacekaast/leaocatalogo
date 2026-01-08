
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, color?: string, fabric?: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product, quantity: number, color?: string, fabric?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedColor === color && item.selectedFabric === fabric);
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.selectedColor === color && item.selectedFabric === fabric)
          ? { ...item, quantity: item.quantity + quantity }
          : item
        );
      }
      return [...prev, { ...product, quantity, selectedColor: color, selectedFabric: fabric }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
