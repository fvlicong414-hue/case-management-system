import { query, queryOne, generateId, nowIso } from "./client";
import type { Settings } from "./types";

const SELECT_COLS = `id, tenant_id as "tenantId", tax_rate as "taxRate", overhead_rate as "overheadRate",
  monthly_fixed_cost as "monthlyFixedCost",
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
      `INSERT INTO settings (id, tenant_id, tax_rate, overhead_rate, monthly_fixed_cost, invoice_number_prefix,
        estimate_number_prefix, project_number_prefix, company_name, created_at, updated_at)
       VALUES ($1, $2, 0.10, 0.0, 0.0, 'INV-', 'EST-', 'PRJ-', '株式会社フォーバル', $3, $4)`,
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
    `UPDATE settings SET tax_rate = $1, overhead_rate = $2, monthly_fixed_cost = $3, invoice_number_prefix = $4,
      estimate_number_prefix = $5, project_number_prefix = $6, company_name = $7,
      company_postal_code = $8, company_address = $9, company_phone = $10,
      company_invoice_registration_number = $11, bank_info = $12, seal_image_path = $13, updated_at = $14
      WHERE tenant_id = $15`,
    [
      merged.taxRate,
      merged.overheadRate,
      merged.monthlyFixedCost,
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
