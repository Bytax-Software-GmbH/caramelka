import { ChevronDownIcon } from "lucide-react";
import { useId } from "react";

import { controlWrapVariants, Field } from "#/components/ck/input";
import { cn } from "#/lib/utils";

export type SelectOption = string | { value: string; label: string; disabled?: boolean };

/** Natives Select mit roségoldenem Chevron, gleiche Hülle wie Input. */
export function Select({
  label,
  hint,
  error,
  size,
  options = [],
  id,
  className,
  children,
  ...rest
}: Omit<React.ComponentProps<"select">, "size"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  options?: SelectOption[];
  className?: string;
}) {
  const uid = useId();
  const fid = id ?? uid;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fid} className={className}>
      <span className={cn(controlWrapVariants({ size, invalid: !!error }), "relative px-0")}>
        <select
          id={fid}
          aria-invalid={error ? true : undefined}
          className="h-full w-full cursor-pointer appearance-none border-0 bg-transparent pr-10 pl-3.5 text-ink outline-none ck-body disabled:cursor-not-allowed"
          {...rest}
        >
          {options.map((o) =>
            typeof o === "string" ? (
              <option key={o} value={o}>
                {o}
              </option>
            ) : (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ),
          )}
          {children}
        </select>
        <ChevronDownIcon
          aria-hidden
          strokeWidth={1.5}
          className="pointer-events-none absolute right-3 size-3.5 text-rosegold-600"
        />
      </span>
    </Field>
  );
}
