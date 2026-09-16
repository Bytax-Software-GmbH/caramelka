import { useId, useState } from "react";

import { cn } from "#/lib/utils";

export interface TabItem {
  value: string;
  label: React.ReactNode;
  content?: React.ReactNode;
  count?: number;
}

/** Reiter mit Haarlinie; der aktive trägt eine roségoldene Unterkante. */
export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  centered,
  inverse,
  className,
}: {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  centered?: boolean;
  inverse?: boolean;
  className?: string;
}) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
  const current = value ?? inner;
  const active = items.find((i) => i.value === current);

  function select(next: string) {
    setInner(next);
    onChange?.(next);
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        className={cn(
          "flex gap-8 overflow-x-auto border-b border-hairline",
          centered && "justify-center",
          inverse && "border-hairline-inverse",
        )}
      >
        {items.map((item) => {
          const isActive = item.value === current;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              id={`${uid}-tab-${item.value}`}
              aria-selected={isActive}
              aria-controls={`${uid}-panel-${item.value}`}
              onClick={() => select(item.value)}
              className={cn(
                "-mb-px inline-flex shrink-0 items-center gap-2 border-b border-transparent py-3 ck-label whitespace-nowrap text-ink-muted transition-[color,border-color] duration-(--dur-fast) ease-out hover:text-ink",
                isActive && "border-accent text-brand",
                inverse && "text-on-inverse-muted hover:text-cream-100",
                inverse && isActive && "text-cream-100",
              )}
            >
              {item.label}
              {item.count != null && (
                <span className="ck-eyebrow text-rosegold-600">{item.count}</span>
              )}
            </button>
          );
        })}
      </div>
      {active?.content && (
        <div
          role="tabpanel"
          id={`${uid}-panel-${active.value}`}
          aria-labelledby={`${uid}-tab-${active.value}`}
          className={cn("pt-6 ck-body", inverse ? "text-on-inverse" : "text-ink")}
        >
          {active.content}
        </div>
      )}
    </div>
  );
}
