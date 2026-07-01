import { query, queryOne, generateId, nowIso } from "./client";
import type { Settings } from "./types";

const SELECT_COLS = `id, tenant_id as "tenantId", tax_rate as "taxRate", overhead_rate as "overheadRate",
  invoice_number_prefix as "invoiceNumberPrefix", estimate_number_prefix as "estimateNumberPrefix",
  project_number_prefix as "projectNumberPrefix", company_name as "companyName",
  company_postal_code as "companyPostalCode", company_address as "companyAddress",
  company_phone as "companyPhone",
  company_invoice_registration_number as "companyInvoiceRegistrationNumber",
  bank_info as "bankInfo", seal_image_path as "sealImagePath",
  created_at as "createdAt", updated_at as "updatedAt"`;

export async function getSettings(tenantId: string): Promise<Settings> {
  let row = await queryOne<Settings>(`SELECT ${SELECT_COLS} FROM settings WHERE tenant_id = $1`, [tenantId]);
  if (!row) {
    const id = generateId();
    const now = nowIso();
    await query(
      `INSERT INTO settings (id, tenant_id, tax_rate, overhead_rate, invoice_number_prefix,
        estimate_number_prefix, project_number_prefix, company_name, created_at, updated_at)
       VALUES ($1, $2, 0.10, 0.0, 'INV-', 'EST-', 'PRJ-', '株式会社フォーバル', $3, $4)`,
      [id, tenantId, now, now]
    );
    row = await queryOne<Settings>(`SELECT ${SELECT_COLS} FROM settings WHERE tenant_id = $1`, [tenantId]);
  }
  return row!;
}

export async function updateSettings(tenantId: string, input: Partial<Settings>): Promise<Settings> {
  const current = await getSettings(tenantId);
  const now = nowIso();
  const merged = { ...current, ...input };
  await query(
    `UPDATE settings SET tax_rate = $1, overhead_rate = $2, invoice_number_prefix = $3,
      estimate_number_prefix = $4, project_number_prefix = $5, company_name = $6,
      company_postal_code = $7, company_address = $8, company_phone = $9,
      company_invoice_registration_number = $10, bank_info = $11, seal_image_path = $12, updated_at = $13
      WHERE tenant_id = $14`,
    [
      merged.taxRate,
      merged.overheadRate,
      merged.invoiceNumberPrefix,
      merged.estimateNumberPrefix,
      merged.projectNumberPrefix,
      merged.companyName,
      merged.companyPostalCode,
      merged.companyAddress,
      merged.companyPhone,
      merged.companyInvoiceRegistrationNumber,
      merged.bankInfo,
      merged.sealImagePath,
      now,
      tenantId,
    ]
  );
  return getSettings(tenantId);
}
