import { useEffect, useState, useCallback } from "react";
import type { OrderItem } from "@/integrations/supabase/types";

const STORAGE_KEY = "gpsbs:cart:v1";
const EVENT = "gpsbs:cart:changed";

function readStorage(): OrderItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OrderItem[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: OrderItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function useCart() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
    const onChange = () => setItems(readStorage());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const add = useCallback((item: Omit<OrderItem, "quantity">, qty = 1) => {
    const current = readStorage();
    const idx = current.findIndex((i) => i.product_id === item.product_id);
    if (idx >= 0) {
      current[idx].quantity += qty;
    } else {
      current.push({ ...item, quantity: qty });
    }
    writeStorage(current);
  }, []);

  const remove = useCallback((productId: string) => {
    writeStorage(readStorage().filter((i) => i.product_id !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    const current = readStorage();
    const idx = current.findIndex((i) => i.product_id === productId);
    if (idx < 0) return;
    if (qty <= 0) {
      current.splice(idx, 1);
    } else {
      current[idx].quantity = qty;
    }
    writeStorage(current);
  }, []);

  const clear = useCallback(() => writeStorage([]), []);

  const totalCents = items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, add, remove, updateQty, clear, totalCents, count, hydrated };
}
