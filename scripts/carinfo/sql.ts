// SQL literal helpers for the carinfo scripts, whose output is run through the Supabase MCP.

export function sqlString(s: string | null | undefined): string {
  return s == null ? "null" : `'${s.replaceAll("'", "''")}'`;
}
