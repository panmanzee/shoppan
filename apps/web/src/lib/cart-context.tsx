"use client";

import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from "react";
import { type Product } from "@/lib/api-client";

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotalCents: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "shoppan:cart";

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  // Hydrate cart from localStorage on mount (client-side only)
  useEffect(() => {
    setLines(loadCart());
  }, []);

  // Persist whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // localStorage unavailable (private browsing quota, etc.) — fail silently
    }
  }, [lines]);

  const addToCart = (product: Product) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  };

  const setQuantity = (productId: string, quantity: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.product.id === productId ? { ...l, quantity: Math.max(1, quantity) } : l
      )
    );
  };

  const clearCart = () => setLines([]);

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
  const subtotalCents = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity * l.product.priceCents, 0),
    [lines]
  );

  return (
    <CartContext.Provider
      value={{ lines, addToCart, removeFromCart, setQuantity, clearCart, itemCount, subtotalCents }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
