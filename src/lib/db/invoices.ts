import { query, queryOne, generateId, nowIso } from "./client";
import type { Invoice, InvoiceItem } from "./types";
import { generateNumber } from "./numbering";
import { getSettings } from "./settings";
import { calcInvoiceTotals } from "../calc";
import {
  getBillingSchedule,
  setBillingScheduleStatus,
  resetBillingSchedulesForInvoice,
  markBillingSchedulesPaid,
} from "./billingSchedules";
import { getProject, updateProjectStatus } from "./projects";

const INV_COLS = `id, tenant_id as "tenantId", invoice_no as "invoiceNo", customer_id as "customerId",
  billing_month as "billingMonth", invoice_date as "invoiceDate", payment_due_date as "paymentDueDate",
  subtotal, tax_amount as "taxAmount", total_amount as "totalAmount", cost_total as "costTotal",
  gross_profit as "grossProfit", overhead_amount as "overheadAmount", operating_profit as "operatingProfit",
  status, paid_date as "paidDate", pdf_path as "pdfPath", canceled_invoice_id as "canceledInvoiceId",
  created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"`;

const ITEM_COLS = `id, tenant_id as "tenantId", invoice_id as "invoiceId",
  billing_schedule_id as "billingScheduleId", project_id as "projectId", site_name as "siteName",
  billing_type as "billingType", amount, sort_order as "sortOrder", created_at as "createdAt",
  updated_at as "updatedAt"`;

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  return queryOne<Invoice>(`SELECT ${INV_COLS} FROM invoices WHERE id = $1`, [id]);
}

export async function listInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  return query<InvoiceItem>(`SELECT ${ITEM_COLS} FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order ASC`, [
    invoiceId,
  ]);
}

export interface InvoiceSearch {
  invoiceNo?: string;
  customerName?: string;
  billingMonth?: string;
  status?: string;
  paidDateFrom?: string;
  paidDateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export async function listInvoices(
  tenantId: string,
  search: InvoiceSearch = {}
): Promise<(Invoice & { customerName?: string })[]> {
  const clauses = ["i.tenant_id = $1"];
  const params: any[] = [tenantId];
  let i = 2;
  if (search.invoiceNo) {
    clauses.push(`i.invoice_no ILIKE $${i++}`);
    params.push(`%${search.invoiceNo}%`);
  }
  if (search.customerName) {
    clauses.push(`c.name ILIKE $${i++}`);
    params.push(`%${search.customerName}%`);
  }
  if (search.billingMonth) {
    clauses.push(`i.billing_month = $${i++}`);
    params.push(search.billingMonth);
  }
  if (search.status) {
    clauses.push(`i.status = $${i++}`);
    params.push(search.status);
  }
  if (search.paidDateFrom) {
    clauses.push(`i.paid_date >= $${i++}`);
    params.push(search.paidDateFrom);
  }
  if (search.paidDateTo) {
    clauses.push(`i.paid_date <= $${i++}`);
    params.push(search.paidDateTo);
  }
  if (search.amountMin !== undefined) {
    clauses.push(`i.total_amount >= $${i++}`);
    params.push(search.amountMin);
  }
  if (search.amountMax !== undefined) {
    clauses.push(`i.total_amount <= $${i++}`);
    params.push(search.amountMax);
  }
  const sql = `SELECT i.id, i.tenant_id as "tenantId", i.invoice_no as "invoiceNo", i.customer_id as "customerId",
      i.billing_month as "billingMonth", i.invoice_date as "invoiceDate", i.payment_due_date as "paymentDueDate",
      i.subtotal, i.tax_amount as "taxAmount", i.total_amount as "totalAmount", i.cost_total as "costTotal",
      i.gross_profit as "grossProfit", i.overhead_amount as "overheadAmount", i.operating_profit as "operatingProfit",
      i.status, i.paid_date as "paidDate", i.pdf_path as "pdfPath", i.canceled_invoice_id as "canceledInvoiceId",
      i.created_by as "createdBy", i.created_at as "createdAt", i.updated_at as "updatedAt", c.name as "customerName"
    FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id
    WHERE ${clauses.join(" AND ")}
    ORDER BY i.created_at DESC`;
  return query(sql, params);
}

/**
 * 月次請求作成: チェックした請求予定IDのリストから1枚の請求書を作成する。
 * 二重請求防止: 対象の billing_schedules はすべて未請求かつ invoice_id が
 * 入っていないことを事前にチェックする。
 */
export async function createInvoiceFromSchedules(
  tenantId: string,
  input: { customerId: string; billingMonth: string; billingScheduleIds: string[]; createdBy?: string; paymentTermsDays?: number }
): Promise<Invoice> {
  if (input.billingScheduleIds.length === 0) {
    throw new Error("請求予定を1件以上選択してください");
  }
  const schedules = [];
  for (const id of input.billingScheduleIds) {
    const s = await getBillingSchedule(id);
    if (!s) throw new Error("請求予定が見つかりません");
    if (s.status !== "未請求" || s.invoiceId) {
      throw new Error(`請求予定(${id})はすでに請求済みのため、二重に請求書を作成できません`);
    }
    schedules.push(s);
  }

  const settings = await getSettings(tenantId);
  const totals = calcInvoiceTotals(
    schedules.map((s) => s.scheduledAmount),
    schedules.map((s) => s.costAllocated),
    settings.overheadRate,
    settings.taxRate
  );

  const id = generateId();
  const now = nowIso();
  const invoiceNo = await generateNumber("invoices", "invoice_no", tenantId, settings.invoiceNumberPrefix);
  const invoiceDate = now.slice(0, 10);
  const dueDays = input.paymentTermsDays ?? 30;
  const dueDate = new Date(Date.now() + dueDays * 86400000).toISOString().slice(0, 10);

  await query(
    `INSERT INTO invoices (id, tenant_id, invoice_no, customer_id, billing_month, invoice_date,
      payment_due_date, subtotal, tax_amount, total_amount, cost_total, gross_profit, overhead_amount,
      operating_profit, status, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, '発行済', $15, $16, $17)`,
    [
      id,
      tenantId,
      invoiceNo,
      input.customerId,
      input.billingMonth,
      invoiceDate,
      dueDate,
      totals.subtotal,
      totals.taxAmount,
      totals.totalAmount,
      totals.costTotal,
      totals.grossProfit,
      totals.overheadAmount,
      totals.operatingProfit,
      input.createdBy ?? null,
      now,
      now,
    ]
  );

  for (let idx = 0; idx < schedules.length; idx++) {
    const s = schedules[idx];
    const project = await getProject(s.projectId);
    const itemId = generateId();
    await query(
      `INSERT INTO invoice_items (id, tenant_id, invoice_id, billing_schedule_id, project_id, site_name,
        billing_type, amount, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        itemId,
        tenantId,
        id,
        s.id,
        s.projectId,
        project?.siteName ?? null,
        s.billingType,
        s.scheduledAmount,
        idx,
        now,
        now,
      ]
    );
    // 二重請求防止: 発行済に更新し、invoice_id を紐づける
    await setBillingScheduleStatus(s.id, "発行済", id);
  }

  return (await getInvoice(id))!;
}

export async function markInvoiceSent(id: string): Promise<Invoice> {
  const now = nowIso();
  await query("UPDATE invoices SET status = '送付済', updated_at = $1 WHERE id = $2", [now, id]);
  return (await getInvoice(id))!;
}

export async function markInvoicePaid(id: string, paidDate: string): Promise<Invoice> {
  if (!paidDate) throw new Error("入金日は必須です");
  const now = nowIso();
  await query("UPDATE invoices SET status = '入金済', paid_date = $1, updated_at = $2 WHERE id = $3", [
    paidDate,
    now,
    id,
  ]);
  await markBillingSchedulesPaid(id);
  // 案件ステータスも入金済に更新(関連する請求明細の案件すべて)
  const items = await listInvoiceItems(id);
  for (const item of items) {
    await updateProjectStatus(item.projectId, "入金済");
  }
  return (await getInvoice(id))!;
}

/** 請求書取消: 関連する請求予定を未請求に戻せるようにする(戻す操作自体は権限チェック後に別途実施) */
export async function cancelInvoice(id: string): Promise<Invoice> {
  const now = nowIso();
  await query("UPDATE invoices SET status = '取消', updated_at = $1 WHERE id = $2", [now, id]);
  await resetBillingSchedulesForInvoice(id);
  return (await getInvoice(id))!;
}

/** 再発行: 取消済み請求書をもとに、新しい請求書番号で作り直す */
export async function reissueInvoice(canceledInvoiceId: string, tenantId: string, createdBy?: string): Promise<Invoice> {
  const canceled = await getInvoice(canceledInvoiceId);
  if (!canceled) throw new Error("元の請求書が見つかりません");
  if (canceled.status !== "取消") throw new Error("取消済みの請求書のみ再発行できます");
  const oldItems = await listInvoiceItems(canceledInvoiceId);
  const billingScheduleIds = oldItems.map((i) => i.billingScheduleId);
  const invoice = await createInvoiceFromSchedules(tenantId, {
    customerId: canceled.customerId,
    billingMonth: canceled.billingMonth,
    billingScheduleIds,
    createdBy,
  });
  const now = nowIso();
  // 新しい請求書に取消元IDを記録(発行済のまま、通常の請求書として運用できるようにする)
  await query("UPDATE invoices SET canceled_invoice_id = $1, updated_at = $2 WHERE id = $3", [
    canceledInvoiceId,
    now,
    invoice.id,
  ]);
  // 取消元の請求書は「再発行済」として履歴に残す
  await query("UPDATE invoices SET status = '再発行済', updated_at = $1 WHERE id = $2", [now, canceledInvoiceId]);
  return (await getInvoice(invoice.id))!;
}
