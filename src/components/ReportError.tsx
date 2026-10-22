"use client";

import { useState, type FormEvent } from "react";
import { Check, Flag } from "lucide-react";
import { button, inputClass } from "@/components/ui";
import { reportError } from "@/lib/carinfoDb";
import type { Dict } from "@/lib/i18n";

type State = "idle" | "open" | "sending" | "sent" | "failed";

/** "Report an error" on car-info pages: one message, stored for the admin inbox. */
export function ReportError({ dict, generationId, engineId }: { dict: Dict; generationId?: string; engineId?: string }) {
  const c = dict.carInfo;
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function submit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = new FormData(ev.currentTarget);
    const text = message.trim();
    if (!text) return;
    // Bots fill every field: a filled hidden field looks sent but is dropped.
    if (form.get("website")) return setState("sent");
    setState("sending");
    try {
      await reportError({ message: text, pageUrl: window.location.pathname, generationId, engineId });
      setState("sent");
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted" role="status">
        <Check className="size-4 text-success" aria-hidden />
        {c.reportThanks}
      </p>
    );
  }
  if (state === "idle") {
    return (
      <button type="button" onClick={() => setState("open")} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <Flag className="size-4" aria-hidden />
        {c.reportButton}
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <textarea
        required
        autoFocus
        rows={3}
        maxLength={2000}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={c.reportPlaceholder}
        aria-label={c.reportButton}
        className={`${inputClass} h-auto py-2`}
      />
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={state === "sending"} className={button("primary", { small: true })}>
          {c.reportSend}
        </button>
        <button type="button" onClick={() => setState("idle")} className={button("ghost", { small: true })}>
          {dict.results.cancel}
        </button>
        {state === "failed" && <span className="text-sm text-danger">{c.reportFailed}</span>}
      </div>
    </form>
  );
}
