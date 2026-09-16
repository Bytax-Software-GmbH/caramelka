import { cva, type VariantProps } from "class-variance-authority";
import { useId } from "react";

import { cn } from "#/lib/utils";

/**
 * Formularfeld: versales Label in Kakao-Braun, Hinweis oder Fehler darunter.
 * Wird von Input, Textarea und Select geteilt.
 */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label htmlFor={htmlFor} className="ck-label text-ink-muted">
          {label}
        </label>
      )}
      {children}
      {(error || hint) && (
        <span className={cn("ck-body-sm", error ? "text-error" : "text-ink-muted")}>
          {error || hint}
        </span>
      )}
    </div>
  );
}

const controlWrapCva = cva(
  "flex items-center gap-2.5 rounded-sm border border-hairline bg-surface px-3.5 text-ink-muted transition-[border-color,box-shadow] duration-(--dur-fast) ease-out focus-within:border-hairline-accent focus-within:shadow-(--focus-ring) hover:border-hairline-strong has-disabled:bg-sunken has-disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-9",
        md: "h-11",
        lg: "h-13",
      },
      inverse: {
        true: "border-hairline-inverse bg-transparent text-rosegold-300 [&_input]:text-cream-100 [&_input::placeholder]:text-rosegold-400",
      },
      invalid: {
        true: "border-error",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export const controlWrapVariants = (options?: VariantProps<typeof controlWrapCva>) =>
  cn(controlWrapCva(options));

type ControlProps = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Klassen für den äußeren Feld-Container. */
  className?: string;
};

export function Input({
  label,
  hint,
  error,
  size,
  inverse,
  leading,
  trailing,
  id,
  className,
  ...rest
}: Omit<React.ComponentProps<"input">, "size"> &
  ControlProps &
  Omit<VariantProps<typeof controlWrapCva>, "invalid"> & {
    leading?: React.ReactNode;
    trailing?: React.ReactNode;
  }) {
  const uid = useId();
  const fid = id ?? uid;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fid} className={className}>
      <span className={controlWrapVariants({ size, inverse, invalid: !!error })}>
        {leading}
        <input
          id={fid}
          aria-invalid={error ? true : undefined}
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-ink outline-none ck-body placeholder:text-ink-subtle"
          {...rest}
        />
        {trailing}
      </span>
    </Field>
  );
}

export function Textarea({
  label,
  hint,
  error,
  id,
  className,
  rows = 3,
  ...rest
}: React.ComponentProps<"textarea"> & ControlProps) {
  const uid = useId();
  const fid = id ?? uid;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fid} className={className}>
      <textarea
        id={fid}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full rounded-sm border border-hairline bg-surface px-3.5 py-2.5 text-ink transition-[border-color,box-shadow] duration-(--dur-fast) ease-out outline-none ck-body placeholder:text-ink-subtle hover:border-hairline-strong focus:border-hairline-accent focus:shadow-(--focus-ring) disabled:bg-sunken disabled:opacity-50",
          error && "border-error",
        )}
        {...rest}
      />
    </Field>
  );
}
