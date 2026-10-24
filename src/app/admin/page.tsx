import Link from "next/link";
import { MAKES } from "@/data/makes";
import { Pill, button, inputClass } from "@/components/ui";
import { requireAdmin } from "@/lib/adminAuth";
import { STATUSES, STATUS_LABEL, carNames, queue, type QueueRow, type Status } from "@/lib/adminData";

const PAGE = 100;
const LOW_CONFIDENCE = 0.6;

const years = (g: Pick<QueueRow, "year_from" | "year_to">) => `${g.year_from}–${g.year_to ?? ""}`;

/** Review queue: generations with open error reports first, then by registrations; filter by make, status, confidence. */
export default async function QueuePage({ searchParams }: PageProps<"/admin">) {
  const q = await searchParams;
  const token = await requireAdmin("/admin/");
  const status = (typeof q.status === "string" ? q.status : "ai_checked") as Status | "all";
  const make = typeof q.make === "string" ? q.make : "";
  const low = q.low === "1";
  const page = Math.max(0, Number(q.page) || 0);

  const all = await queue(token);
  const counts = new Map<string, number>();
  for (const g of all) counts.set(g.status, (counts.get(g.status) ?? 0) + 1);
  const rows = all.filter(
    (g) =>
      (status === "all" || g.status === status) &&
      (!make || g.model_id.startsWith(`${make}-`)) &&
      (!low || (g.ai_confidence ?? 1) < LOW_CONFIDENCE),
  );
  const shown = rows.slice(page * PAGE, (page + 1) * PAGE);
  const href = (p: number) => `/admin/?${new URLSearchParams({ status, make, ...(low ? { low: "1" } : {}), page: String(p) })}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-xl font-semibold">Vrsta za pregled</h1>
        <p className="text-sm text-muted">
          {STATUSES.map((s) => `${STATUS_LABEL[s]} ${counts.get(s) ?? 0}`).join(" · ")}
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
        <label className="text-[13px] text-muted">
          Status
          <select name="status" defaultValue={status} className={`${inputClass} mt-1 w-44`}>
            <option value="all">vsi</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[13px] text-muted">
          Znamka
          <select name="make" defaultValue={make} className={`${inputClass} mt-1 w-48`}>
            <option value="">vse</option>
            {MAKES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="low" value="1" defaultChecked={low} /> zaupanje pod {LOW_CONFIDENCE}
        </label>
        <button className={button("secondary")}>Filtriraj</button>
      </form>

      <p className="text-sm text-muted">{rows.length} generacij</p>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface-low text-left text-[13px] text-muted">
            <tr>
              <th className="px-3 py-2">Avto</th>
              <th className="px-3 py-2">Leta</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Zaupanje</th>
              <th className="px-3 py-2 text-right">Registracije</th>
              <th className="px-3 py-2">Opozorila</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((g) => {
              const c = carNames(g.model_id);
              return (
                <tr key={g.id} className="border-t border-border hover:bg-surface-low">
                  <td className="px-3 py-2">
                    <Link href={`/admin/g/${g.id}/`} className="font-medium text-accent hover:underline">
                      {c ? `${c.make.name} ${c.model.name}` : g.model_id} {g.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{years(g)}</td>
                  <td className="px-3 py-2">{STATUS_LABEL[g.status]}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${(g.ai_confidence ?? 1) < LOW_CONFIDENCE ? "text-warning" : ""}`}>
                    {g.ai_confidence?.toFixed(2) ?? "–"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{g.registrations.toLocaleString("sl")}</td>
                  <td className="space-x-1 px-3 py-2">
                    {g.reports > 0 && <Pill tone="danger">{g.reports} prijav</Pill>}
                    {g.weak > 0 && <Pill tone="warning">{g.weak} šibkih virov</Pill>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3">
        {page > 0 && (
          <Link href={href(page - 1)} className={button("secondary", { small: true })}>
            Nazaj
          </Link>
        )}
        {(page + 1) * PAGE < rows.length && (
          <Link href={href(page + 1)} className={button("secondary", { small: true })}>
            Naprej
          </Link>
        )}
      </div>
    </div>
  );
}
