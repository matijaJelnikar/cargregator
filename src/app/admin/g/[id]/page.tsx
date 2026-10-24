import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Card, Pill, button, inputClass, type Tone } from "@/components/ui";
import { requireAdmin } from "@/lib/adminAuth";
import { STATUS_LABEL, carNames, publicUrl, reviewGeneration, type ReviewGeneration } from "@/lib/adminData";
import { deleteLink, resolveReport, saveCheck, saveEngine, saveFailure, saveGeneration, setGenerationStatus } from "../../actions";

const area = `${inputClass} h-auto min-h-20 py-2 leading-snug`;
const CHECK_TONE: Record<string, Tone> = { supported: "success", weak: "warning", unsupported: "danger" };
const ITEM_STATUSES = ["ai_checked", "reviewed", "hidden"] as const;

function Text({ name, label, value, rows = 3 }: { name: string; label: string; value: string | null; rows?: number }) {
  return (
    <label className="block text-[13px] text-muted">
      {label}
      <textarea name={name} defaultValue={value ?? ""} rows={rows} className={`${area} mt-1 text-foreground`} />
    </label>
  );
}

function Hidden({ values }: { values: Record<string, string> }) {
  return Object.entries(values).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />);
}

function StatusSelect({ value }: { value: string }) {
  return (
    <select name="status" defaultValue={value} className={`${inputClass} w-40`}>
      {ITEM_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

function Save({ children = "Shrani" }: { children?: ReactNode }) {
  return <button className={button("secondary", { small: true })}>{children}</button>;
}

function StatusButtons({ g }: { g: ReviewGeneration }) {
  const next = `/admin/g/${g.id}/`;
  const go = (status: string, label: string, variant: "primary" | "secondary" | "ghost") => (
    <form action={setGenerationStatus}>
      <Hidden values={{ id: g.id, status, next }} />
      <button className={button(variant, { small: true })}>{label}</button>
    </form>
  );
  return (
    <div className="flex flex-wrap gap-2">
      {g.status !== "reviewed" && go("reviewed", "Odobri (pregledano)", "primary")}
      {g.status !== "ai_checked" && g.status !== "skeleton" && go("ai_checked", "Nazaj v vrsto", "secondary")}
      {g.status !== "skeleton" && go("skeleton", "Umakni poročilo s strani", "ghost")}
    </div>
  );
}

/** Side-by-side review of one generation: the editable report on the left, sources and check notes on the right. */
export default async function ReviewPage({ params, searchParams }: PageProps<"/admin/g/[id]">) {
  const { id } = await params;
  const q = await searchParams;
  const token = await requireAdmin(`/admin/g/${id}/`);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const g = await reviewGeneration(token, id);
  if (!g) notFound();
  const c = carNames(g.model_id);
  const url = publicUrl(g.model_id);
  const engineName = new Map(g.engines.map((e) => [e.id, e.name]));
  const gid = { gid: g.id };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/" className="text-sm text-muted hover:underline">
            ← vrsta
          </Link>
          <h1 className="text-xl font-semibold">
            {c ? `${c.make.name} ${c.model.name}` : g.model_id} {g.name} {g.code && g.code !== g.name ? `(${g.code})` : ""}, {g.year_from}–{g.year_to ?? ""}
          </h1>
          <p className="text-sm text-muted">
            {STATUS_LABEL[g.status]} · zaupanje {g.ai_confidence?.toFixed(2) ?? "–"} · {g.generated_by ?? "brez poročila"}
            {g.reviewed_at && ` · pregledano ${new Date(g.reviewed_at).toLocaleDateString("sl")}`}
            {url && (
              <>
                {" · "}
                <a href={url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  javna stran
                </a>
              </>
            )}
          </p>
        </div>
        <StatusButtons g={g} />
      </div>

      {q.error && <p className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{String(q.error)}</p>}
      {q.saved && <p className="rounded-lg bg-success-soft p-3 text-sm text-success">Shranjeno.</p>}

      {g.reports.some((r) => !r.resolved) && (
        <Card title="Prijave napak">
          <ul className="space-y-3 text-sm">
            {g.reports
              .filter((r) => !r.resolved)
              .map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="whitespace-pre-wrap">{r.message}</p>
                    <p className="text-[13px] text-muted">
                      {new Date(r.created_at).toLocaleString("sl")} {r.engine_id && `· ${engineName.get(r.engine_id) ?? "motor"}`} {r.page_url}
                    </p>
                  </div>
                  <form action={resolveReport}>
                    <Hidden values={{ id: r.id, resolved: "true", next: `/admin/g/${g.id}/` }} />
                    <Save>Rešeno</Save>
                  </form>
                </li>
              ))}
          </ul>
        </Card>
      )}

      <Card title="Povzetek">
        <form action={saveGeneration} className="space-y-3">
          <Hidden values={{ id: g.id }} />
          <div className="grid gap-3 md:grid-cols-2">
            <Text name="summary_sl" label="Povzetek (SL)" value={g.summary_sl} rows={5} />
            <Text name="summary_en" label="Summary (EN)" value={g.summary_en} rows={5} />
            <Text name="pros_sl" label="Prednosti, ena na vrstico (SL)" value={g.pros.map((p) => p.sl).join("\n")} rows={5} />
            <Text name="pros_en" label="Pros, one per line (EN)" value={g.pros.map((p) => p.en).join("\n")} rows={5} />
            <Text name="cons_sl" label="Slabosti, ena na vrstico (SL)" value={g.cons.map((p) => p.sl).join("\n")} rows={5} />
            <Text name="cons_en" label="Cons, one per line (EN)" value={g.cons.map((p) => p.en).join("\n")} rows={5} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] text-muted">
              Euro NCAP:{" "}
              {g.ncap_url ? (
                <a href={g.ncap_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  {g.ncap_stars}★ ({g.ncap_year})
                </a>
              ) : (
                "–"
              )}
            </p>
            <Save />
          </div>
        </form>
      </Card>

      <Card title={`Motorji (${g.engines.length})`} className="scroll-mt-4" aside={<span id="engines" />}>
        <div className="space-y-4">
          {g.engines.map((e) => (
            <form key={e.id} action={saveEngine} className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
              <Hidden values={{ ...gid, id: e.id }} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {e.name} <span className="text-[13px] font-normal text-muted">{e.fuel} · {e.kw ?? "?"} kW · {e.registrations.toLocaleString("sl")} reg. · ocena {e.score ?? "–"}</span>
                </p>
                <div className="flex items-center gap-2">
                  <select name="verdict" defaultValue={e.verdict ?? ""} className={`${inputClass} w-36`}>
                    <option value="">–</option>
                    <option value="recommended">priporočljiv</option>
                    <option value="ok">v redu</option>
                    <option value="avoid">izogibaj se</option>
                  </select>
                  <Save />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Text name="summary_sl" label="SL" value={e.summary_sl} rows={2} />
                <Text name="summary_en" label="EN" value={e.summary_en} rows={2} />
              </div>
            </form>
          ))}
        </div>
      </Card>

      <Card title={`Okvare (${g.failures.length})`} aside={<span id="failures" />}>
        <div className="space-y-5">
          {g.failures.map((f) => (
            <form key={f.id} action={saveFailure} className="grid gap-4 border-b border-border pb-5 last:border-0 last:pb-0 lg:grid-cols-[2fr_1fr]">
              <Hidden values={{ ...gid, id: f.id }} />
              <div className="space-y-2">
                <p className="text-[13px] text-muted">
                  {f.area} · {f.engine_id ? engineName.get(f.engine_id) : "cela generacija"} · verjetnost {f.likelihood}
                  {f.cost_max != null && ` · ${f.cost_min ?? 0}–${f.cost_max} €`}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Text name="title_sl" label="Naslov (SL)" value={f.title_sl} rows={1} />
                  <Text name="title_en" label="Title (EN)" value={f.title_en} rows={1} />
                  <Text name="body_sl" label="Opis (SL)" value={f.body_sl} rows={4} />
                  <Text name="body_en" label="Body (EN)" value={f.body_en} rows={4} />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <StatusSelect value={f.status} />
                  <Save />
                </div>
              </div>
              <aside className="space-y-2 rounded-lg bg-surface-low p-3 text-sm">
                {f.ai_check && <Pill tone={CHECK_TONE[f.ai_check]}>{f.ai_check}</Pill>}
                {f.ai_note && <p className="text-[13px] text-muted">{f.ai_note}</p>}
                <ul className="space-y-1">
                  {f.sources.map((s) => (
                    <li key={s.url} className="break-all">
                      <a href={s.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                        {s.title || s.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </aside>
            </form>
          ))}
        </div>
      </Card>

      <Card title={`Kontrolni seznam (${g.checks.length})`} aside={<span id="checks" />}>
        <div className="space-y-3">
          {g.checks.map((ch) => (
            <form key={ch.id} action={saveCheck} className="grid items-end gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
              <Hidden values={{ ...gid, id: ch.id }} />
              <Text name="text_sl" label="SL" value={ch.text_sl} rows={1} />
              <Text name="text_en" label="EN" value={ch.text_en} rows={1} />
              <StatusSelect value={ch.status} />
              <Save />
            </form>
          ))}
        </div>
      </Card>

      <Card title={`Povezave (${g.links.length})`} aside={<span id="links" />}>
        <ul className="space-y-2 text-sm">
          {g.links.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3">
              <span className="break-all">
                <span className="text-muted">{l.kind}</span>{" "}
                <a href={l.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  {l.label}
                </a>
              </span>
              <form action={deleteLink}>
                <Hidden values={{ ...gid, id: l.id }} />
                <Save>Odstrani</Save>
              </form>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
