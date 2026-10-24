import Link from "next/link";
import { button } from "@/components/ui";
import { requireAdmin } from "@/lib/adminAuth";
import { carNames, reportInbox } from "@/lib/adminData";
import { resolveReport } from "../actions";

/** Inbox of the public "report an error" form; open reports first, ?all=1 shows resolved ones too. */
export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  const all = (await searchParams).all === "1";
  const next = `/admin/reports/${all ? "?all=1" : ""}`;
  const token = await requireAdmin(next);
  const reports = await reportInbox(token, all);

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-semibold">Prijave napak</h1>
        <Link href={all ? "/admin/reports/" : "/admin/reports/?all=1"} className="text-sm text-accent hover:underline">
          {all ? "samo odprte" : "pokaži tudi rešene"}
        </Link>
      </div>
      {reports.length === 0 && <p className="text-sm text-muted">Ni prijav.</p>}
      <ul className="space-y-3">
        {reports.map((r) => {
          const c = r.generations && carNames(r.generations.model_id);
          return (
            <li key={r.id} className={`flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 ${r.resolved ? "opacity-60" : ""}`}>
              <div className="min-w-0 space-y-1">
                <p className="whitespace-pre-wrap text-sm">{r.message}</p>
                <p className="text-[13px] text-muted">
                  {new Date(r.created_at).toLocaleString("sl")}
                  {r.generations && (
                    <>
                      {" · "}
                      <Link href={`/admin/g/${r.generations.id}/`} className="text-accent hover:underline">
                        {c ? `${c.make.name} ${c.model.name}` : r.generations.model_id} {r.generations.name}
                      </Link>
                    </>
                  )}
                  {r.page_url && <span className="break-all"> · {r.page_url}</span>}
                </p>
              </div>
              <form action={resolveReport}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="resolved" value={String(!r.resolved)} />
                <input type="hidden" name="next" value={next} />
                <button className={button("secondary", { small: true })}>{r.resolved ? "Ponovno odpri" : "Rešeno"}</button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
