import { createContext, use, useMemo, useState } from "react";

/**
 * Offen/Zu-Zustand des Warenkorb-Drawers. Sitzt im Root-Layout, damit die
 * Produktseite ihn nach dem Hinzufügen öffnen kann; gerendert wird der
 * Drawer selbst nur im öffentlichen Shell.
 */
interface BagDrawerContextValue {
  open: boolean;
  openBag: () => void;
  closeBag: () => void;
}

const BagDrawerContext = createContext<BagDrawerContextValue | null>(null);

export function BagDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo<BagDrawerContextValue>(
    () => ({ open, openBag: () => setOpen(true), closeBag: () => setOpen(false) }),
    [open],
  );
  return <BagDrawerContext value={value}>{children}</BagDrawerContext>;
}

export function useBagDrawer() {
  const ctx = use(BagDrawerContext);
  if (!ctx) throw new Error("useBagDrawer must be used within BagDrawerProvider");
  return ctx;
}
