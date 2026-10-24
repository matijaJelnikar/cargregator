import { button, inputClass } from "@/components/ui";
import { login, logout } from "../actions";

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const q = await searchParams;
  return (
    <div className="mx-auto max-w-sm space-y-4 pt-10">
      <h1 className="text-xl font-semibold">Prijava</h1>
      {q.sent && <p className="rounded-lg bg-success-soft p-3 text-sm text-success">Povezava za prijavo je poslana. Odpri jo v tem brskalniku.</p>}
      {q.denied && (
        <div className="space-y-2 rounded-lg bg-warning-soft p-3 text-sm text-warning">
          <p>Ta račun ni med skrbniki (carinfo.admins).</p>
          <form action={logout}>
            <button className="underline">Odjava</button>
          </form>
        </div>
      )}
      {q.error && <p className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{String(q.error)}</p>}
      <form action={login} className="space-y-3">
        <label htmlFor="email" className="text-[13px] font-medium text-muted">
          E-pošta
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
        <button className={button("primary", { className: "w-full" })}>Pošlji povezavo</button>
      </form>
    </div>
  );
}
