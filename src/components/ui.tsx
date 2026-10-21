import type { ComponentProps, ReactNode } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";

const control =
  "h-11 w-full rounded-[10px] border border-border-strong bg-input px-3 text-[15px] outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export const inputClass = control;

type ButtonVariant = "primary" | "secondary" | "soft" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-foreground hover:bg-accent-hover",
  secondary: "border border-border-strong bg-card text-foreground hover:bg-surface-low",
  soft: "bg-surface-low text-accent hover:bg-surface",
  ghost: "text-muted hover:bg-surface-low hover:text-foreground",
};

/** Button look for <button>, <a> and <Link>; 44 px tall unless `small`. */
export function button(variant: ButtonVariant, { small = false, className = "" } = {}) {
  return `inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    small ? "h-9 px-3 text-[13px]" : "min-h-11 px-4 text-sm"
  } ${variants[variant]} ${className}`;
}

export function Field({ label, htmlFor, aside, children }: { label: string; htmlFor?: string; aside?: ReactNode; children: ReactNode }) {
  const cls = "text-[13px] font-medium text-muted";
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        {htmlFor ? <label htmlFor={htmlFor} className={cls}>{label}</label> : <span className={cls}>{label}</span>}
        {aside}
      </div>
      {children}
    </div>
  );
}

/** A section card: icon tile and title on the left, optional `aside` (step number, status pill) on the right. */
export function Card({
  title,
  icon: Icon,
  aside,
  className = "",
  children,
}: {
  title?: ReactNode;
  icon?: LucideIcon;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-border bg-card p-4 sm:p-5 ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3.5">
          <h2 className="flex items-center gap-2.5 font-semibold">
            {Icon && (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
              </span>
            )}
            {title}
          </h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/** Small monospaced label: "SECTION 01/03", "STEP 02". */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  // A colour passed in replaces the default one (both classes would leave the winner to stylesheet order).
  const color = /(^|\s)text-[a-z]/.test(className) ? "" : "text-subtle";
  return <span className={`font-mono text-[11px] font-medium uppercase tracking-wider ${color} ${className}`}>{children}</span>;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <div className={`relative w-full ${className ?? ""}`}>
      <select {...props} className={`${control} appearance-none pr-9`} />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
    </div>
  );
}

export function NumberInput({
  value,
  onValue,
  className,
  unit,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange"> & {
  value?: number;
  onValue: (v: number | undefined) => void;
  /** Shown inside the field on the right: "km", "€", "g/km". */
  unit?: string;
}) {
  return (
    <div className={`relative w-full ${className ?? ""}`}>
      <input
        {...props}
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onValue(Number.isFinite(n) && n >= 0 ? n : undefined);
        }}
        className={`${control} font-mono text-[15px] ${unit ? "pr-12" : ""}`}
      />
      {unit && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-subtle" aria-hidden>
          {unit}
        </span>
      )}
    </div>
  );
}

export function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors ${
        pressed ? "bg-accent text-accent-foreground" : "bg-surface-low text-foreground hover:bg-surface"
      }`}
    >
      {pressed && <Check className="size-3.5" strokeWidth={2.5} aria-hidden />}
      {children}
    </button>
  );
}

export function Segmented({
  label,
  value,
  options,
  onChange,
  full = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  /** Stretch the options over the whole width. */
  full?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`h-11 rounded-[10px] bg-surface-low p-1 ${full ? "grid w-full auto-cols-fr grid-flow-col" : "inline-flex"}`}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 text-[13px] whitespace-nowrap transition-colors ${
            value === o.value ? "bg-card font-semibold text-accent shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
  className = "mt-2",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex min-h-9 cursor-pointer items-center gap-2.5 text-sm ${className}`}>
      <input
        type="checkbox"
        className="size-[18px] shrink-0 rounded accent-[var(--accent)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {children}
    </label>
  );
}

export type Tone = "accent" | "success" | "warning" | "info" | "danger" | "neutral";

const tones: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-low text-muted",
};

/** Status pill; `dot` adds a leading status dot. */
export function Pill({ tone, dot = false, children }: { tone: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium ${tones[tone]}`}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/** Country code of a site's market: SI, DE, EU… */
export function CountryCode({ code }: { code: string }) {
  return (
    <span className="inline-flex h-5 items-center rounded bg-info-soft px-1.5 font-mono text-[11px] font-semibold text-info">{code}</span>
  );
}

/** A filter shown as a chip in a summary row. */
export function FilterChip({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-surface-low px-2.5 font-mono text-[12px] text-foreground">
      {Icon && <Icon className="size-3.5 text-muted" aria-hidden />}
      {children}
    </span>
  );
}

export function Toast({ message }: { message: string | null }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 sm:bottom-8 sm:justify-end sm:px-8">
      {message && (
        <div className="flex items-center gap-3 rounded-xl bg-foreground py-3 pl-3 pr-5 text-sm font-medium text-background shadow-overlay">
          <span className="flex size-6 items-center justify-center rounded-full bg-success text-background">
            <Check className="size-4" strokeWidth={2.5} aria-hidden />
          </span>
          {message}
        </div>
      )}
    </div>
  );
}
