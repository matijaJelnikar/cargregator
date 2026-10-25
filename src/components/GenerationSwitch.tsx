"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type GenerationStore = {
  selected: string;
  open: Set<string>;
  select: (slug: string) => void;
  toggle: (slug: string, open: boolean) => void;
};

const GenerationContext = createContext<GenerationStore | null>(null);

/** Shares the generation picked in the hero with the generation cards below, so picking one opens its card. */
export function GenerationProvider({ initial, children }: { initial: string; children: ReactNode }) {
  const [selected, setSelected] = useState(initial);
  const [open, setOpen] = useState<Set<string>>(() => new Set([initial]));
  const select = useCallback((slug: string) => {
    setSelected(slug);
    setOpen(new Set([slug]));
  }, []);
  const toggle = useCallback((slug: string, isOpen: boolean) => {
    setOpen((prev) => {
      if (prev.has(slug) === isOpen) return prev;
      const next = new Set(prev);
      if (isOpen) next.add(slug);
      else next.delete(slug);
      return next;
    });
  }, []);
  const value = useMemo(() => ({ selected, open, select, toggle }), [selected, open, select, toggle]);
  return <GenerationContext.Provider value={value}>{children}</GenerationContext.Provider>;
}

/** The generation currently picked in the hero. */
export function useGeneration(): { selected: string; select: (slug: string) => void } {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error("useGeneration must be used inside a GenerationProvider");
  return { selected: ctx.selected, select: ctx.select };
}

/** A generation card whose open state follows the hero's chips; opening or closing it by hand keeps the hero selection. */
export function GenerationDetails({ slug, className, children }: { slug: string; className?: string; children: ReactNode }) {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error("GenerationDetails must be used inside a GenerationProvider");
  return (
    <details id={slug} open={ctx.open.has(slug)} onToggle={(e) => ctx.toggle(slug, e.currentTarget.open)} className={className}>
      {children}
    </details>
  );
}
