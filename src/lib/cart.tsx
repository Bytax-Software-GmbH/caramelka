import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";

export interface CartItem {
  /** Client-Key: productId + sizeId + fillingId + inscription. */
  key: string;
  productId: number;
  slug: string;
  nameDe: string;
  nameRu: string;
  imageKey: string;
  sizeId: number;
  sizeLabelDe: string;
  sizeLabelRu: string;
  fillingId: number | null;
  fillingNameDe: string | null;
  fillingNameRu: string | null;
  inscription: string | null;
  unitPriceCents: number;
  quantity: number;
  leadTimeHours: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  /** Größter Vorlauf im Warenkorb → bestimmt frühestes Wunschdatum. */
  maxLeadTimeHours: number;
  add: (item: Omit<CartItem, "key">) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "ck-cart-v1";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Start leer (SSR-stabil), nach Mount aus localStorage hydratisieren.
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "key">) => {
    const key = `${item.productId}:${item.sizeId}:${item.fillingId ?? 0}:${item.inscription ?? ""}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + item.quantity } : i,
        );
      }
      return [...prev, { ...item, key }];
    });
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.key !== key)
        : prev.map((i) => (i.key === key ? { ...i, quantity } : i)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const subtotalCents = items.reduce((n, i) => n + i.unitPriceCents * i.quantity, 0);
    const maxLeadTimeHours = items.reduce((n, i) => Math.max(n, i.leadTimeHours), 0);
    return { items, count, subtotalCents, maxLeadTimeHours, add, remove, setQuantity, clear };
  }, [items, add, remove, setQuantity, clear]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = use(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
