import { query, generateId, nowIso } from "./client";
import type { DocumentLog, DocumentLogType } from "./types";

const COLS = `id, tenant_id as "tenantId", document_type as "documentType", target_id as "targetId",
  pdf_path as "pdfPath", file_name as "fileName", output_by as "outputBy", output_at as "outputAt",
  status, created_at as "createdAt"`;

export async function createDocumentLog(input: {
  tenantId: string;
  documentType: DocumentLogType;
  targetId: string;
  fileName: string;
  outputBy?: string | null;
}): Promise<DocumentLog> {
  const id = generateId();
  const now = nowIso();
  await query(
    `INSERT INTO document_logs (id, tenant_id, document_type, target_id, file_name, output_by, output_at,
      status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, '出力済', $8)`,
    [id, input.tenantId, input.documentType, input.targetId, input.fileName, input.outputBy ?? null, now, now]
  );
  const rows = await query<DocumentLog>(`SELECT ${COLS} FROM document_logs WHERE id = $1`, [id]);
  return rows[0];
}

export interface DocumentLogSearch {
  documentType?: DocumentLogType;
  customerName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listDocumentLogs(tenantId: string, search: DocumentLogSearch = {}): Promise<DocumentLog[]> {
  const clauses = ["tenant_id = $1"];
  const params: any[] = [tenantId];
  let i = 2;
  if (search.documentType) {
    clauses.push(`document_type = $${i++}`);
    params.push(search.documentType);
  }
  if (search.dateFrom) {
    clauses.push(`output_at >= $${i++}`);
    params.push(search.dateFrom);
  }
  if (search.dateTo) {
    clauses.push(`output_at <= $${i++}`);
    params.push(search.dateTo);
  }
  const sql = `SELECT ${COLS} FROM document_logs WHERE ${clauses.join(" AND ")} ORDER BY output_at DESC`;
  return query<DocumentLog>(sql, params);
}
