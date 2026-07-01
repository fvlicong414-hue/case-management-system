import { query, generateId, nowIso } from "./client";
import type { DocumentFormat, DocumentType } from "./types";

const SELECT_COLS = `id, tenant_id as "tenantId", name, document_type as "documentType",
  template_file as "templateFile", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`;

export async function listDocumentFormats(tenantId: string, documentType?: DocumentType): Promise<DocumentFormat[]> {
  if (documentType) {
    return query<DocumentFormat>(
      `SELECT ${SELECT_COLS} FROM document_formats WHERE tenant_id = $1 AND document_type = $2`,
      [tenantId, documentType]
    );
  }
  return query<DocumentFormat>(`SELECT ${SELECT_COLS} FROM document_formats WHERE tenant_id = $1`, [tenantId]);
}

export async function ensureDefaultFormats(tenantId: string): Promise<void> {
  const existing = await listDocumentFormats(tenantId);
  const defaults: { name: string; documentType: DocumentType }[] = [
    { name: "標準見積書", documentType: "estimate" },
    { name: "標準仕様書", documentType: "specification" },
    { name: "標準請求書", documentType: "invoice" },
  ];
  for (const d of defaults) {
    if (!existing.find((e) => e.documentType === d.documentType)) {
      const id = generateId();
      const now = nowIso();
      await query(
        `INSERT INTO document_formats (id, tenant_id, name, document_type, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, $5, $6)`,
        [id, tenantId, d.name, d.documentType, now, now]
      );
    }
  }
}
