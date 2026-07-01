import { query, queryOne, generateId, nowIso } from "./client";
import type { Customer } from "./types";

const SELECT_COLS = `id, tenant_id as "tenantId", customer_code as "customerCode", name,
  billing_name as "billingName", postal_code as "postalCode", address, phone,
  contact_person as "contactPerson", closing_day as "closingDay", payment_terms as "paymentTerms",
  invoice_format_id as "invoiceFormatId", quote_format_id as "quoteFormatId",
  spec_format_id as "specFormatId", memo, is_active as "isActive",
  created_at as "createdAt", updated_at as "updatedAt"`;

export interface CustomerSearch {
  name?: string;
  billingName?: string;
  address?: string;
  contactPerson?: string;
  includeInactive?: boolean;
}

export async function listCustomers(tenantId: string, search: CustomerSearch = {}): Promise<Customer[]> {
  const clauses = ["tenant_id = $1"];
  const params: any[] = [tenantId];
  let i = 2;
  if (search.name) {
    clauses.push(`name ILIKE $${i++}`);
    params.push(`%${search.name}%`);
  }
  if (search.billingName) {
    clauses.push(`billing_name ILIKE $${i++}`);
    params.push(`%${search.billingName}%`);
  }
  if (search.address) {
    clauses.push(`address ILIKE $${i++}`);
    params.push(`%${search.address}%`);
  }
  if (search.contactPerson) {
    clauses.push(`contact_person ILIKE $${i++}`);
    params.push(`%${search.contactPerson}%`);
  }
  if (!search.includeInactive) {
    clauses.push("is_active = true");
  }
  const sql = `SELECT ${SELECT_COLS} FROM customers WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC`;
  return query<Customer>(sql, params);
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  return queryOne<Customer>(`SELECT ${SELECT_COLS} FROM customers WHERE id = $1`, [id]);
}

export async function createCustomer(
  tenantId: string,
  input: Omit<Customer, "id" | "tenantId" | "isActive" | "createdAt" | "updatedAt" | "customerCode">
): Promise<Customer> {
  const id = generateId();
  const now = nowIso();
  const countRow = await queryOne<{ cnt: string }>("SELECT COUNT(*) as cnt FROM customers WHERE tenant_id = $1", [
    tenantId,
  ]);
  const customerCode = `C${String(Number(countRow?.cnt ?? 0) + 1).padStart(5, "0")}`;
  await query(
    `INSERT INTO customers (id, tenant_id, customer_code, name, billing_name, postal_code, address, phone,
      contact_person, closing_day, payment_terms, invoice_format_id, quote_format_id, spec_format_id,
      memo, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, $16, $17)`,
    [
      id,
      tenantId,
      customerCode,
      input.name,
      input.billingName,
      input.postalCode,
      input.address,
      input.phone,
      input.contactPerson,
      input.closingDay,
      input.paymentTerms,
      input.invoiceFormatId,
      input.quoteFormatId,
      input.specFormatId,
      input.memo,
      now,
      now,
    ]
  );
  return (await getCustomer(id))!;
}

export async function updateCustomer(id: string, input: Partial<Customer>): Promise<Customer> {
  const current = await getCustomer(id);
  if (!current) throw new Error("顧客が見つかりません");
  const merged = { ...current, ...input };
  const now = nowIso();
  await query(
    `UPDATE customers SET name = $1, billing_name = $2, postal_code = $3, address = $4, phone = $5,
      contact_person = $6, closing_day = $7, payment_terms = $8, invoice_format_id = $9,
      quote_format_id = $10, spec_format_id = $11, memo = $12, is_active = $13, updated_at = $14 WHERE id = $15`,
    [
      merged.name,
      merged.billingName,
      merged.postalCode,
      merged.address,
      merged.phone,
      merged.contactPerson,
      merged.closingDay,
      merged.paymentTerms,
      merged.invoiceFormatId,
      merged.quoteFormatId,
      merged.specFormatId,
      merged.memo,
      merged.isActive,
      now,
      id,
    ]
  );
  return (await getCustomer(id))!;
}

export async function setCustomerActive(id: string, isActive: boolean): Promise<Customer> {
  return updateCustomer(id, { isActive });
}
