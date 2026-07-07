import { useEffect, useState, useCallback } from "react";
import type { OrderItem } from "@/lib/marketplace-types";

const STORAGE_KEY = "gpsbs:cart:v1";
const EVENT = "gpsbs:cart:changed";

function itemKey(i: Pick<OrderItem, "product_id" | "variant_id">) {
  return `${i.product_id}::${i.variant_id ?? ""}`;
}

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
    const key = itemKey(item);
    const idx = current.findIndex((i) => itemKey(i) === key);
    if (idx >= 0) {
      current[idx].quantity += qty;
    } else {
      current.push({ ...item, quantity: qty });
    }
    writeStorage(current);
  }, []);

  const remove = useCallback((productId: string, variantId?: string | null) => {
    const key = itemKey({ product_id: productId, variant_id: variantId ?? null });
    writeStorage(readStorage().filter((i) => itemKey(i) !== key));
  }, []);

  const updateQty = useCallback((productId: string, qty: number, variantId?: string | null) => {
    const current = readStorage();
    const key = itemKey({ product_id: productId, variant_id: variantId ?? null });
    const idx = current.findIndex((i) => itemKey(i) === key);
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
