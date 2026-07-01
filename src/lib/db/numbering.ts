import { queryOne } from "./client";

/**
 * 採番ルール: {prefix}{YYYYMM}-{連番4桁}
 * 例: EST-202607-0001
 * 年月ごとに連番をリセットする。
 */
export async function generateNumber(
  table: "projects" | "estimates" | "invoices",
  column: "project_code" | "estimate_no" | "invoice_no",
  tenantId: string,
  prefix: string
): Promise<string> {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const likePattern = `${prefix}${yyyymm}-%`;
  const row = await queryOne<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM ${table} WHERE tenant_id = $1 AND ${column} LIKE $2`,
    [tenantId, likePattern]
  );
  const seq = String(Number(row?.cnt ?? 0) + 1).padStart(4, "0");
  return `${prefix}${yyyymm}-${seq}`;
}
