import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { createContext, use, useCallback, useMemo, useState } from "react";

import { type Dict, dictionaries } from "./dict";

export type Locale = "de" | "ru";

const COOKIE = "ck-locale";
const MAX_AGE = 60 * 60 * 24 * 365;

function isLocale(v: unknown): v is Locale {
  return v === "de" || v === "ru";
}

/** SSR: Sprache aus dem Cookie lesen (wird im __root-Loader aufgerufen). */
export const $getLocale = createServerFn({ method: "GET" }).handler((): Locale => {
  const raw = getCookie(COOKIE);
  return isLocale(raw) ? raw : "de";
});

interface I18nContextValue {
  locale: Locale;
  t: Dict;
  setLocale: (l: Locale) => void;
  /** Wählt das passende DB-Feld: pickL(product.nameDe, product.nameRu). */
  pickL: (de: string, ru: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `${COOKIE}=${l}; path=/; max-age=${MAX_AGE}; samesite=lax`;
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: dictionaries[locale],
      setLocale,
      pickL: (de, ru) => (locale === "ru" && ru ? ru : de),
    }),
    [locale, setLocale],
  );

  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n() {
  const ctx = use(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
