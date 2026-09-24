import { query, queryOne } from "./client";

export interface CustomerMonthlySale {
  billingMonth: string;
  totalAmount: number;
}

export async function getCustomerMonthlySales(
  tenantId: string,
  customerId: string,
  months = 6
): Promise<CustomerMonthlySale[]> {
  const rows = await query<{ billingMonth: string; total: string }>(
    `SELECT billing_month as "billingMonth", COALESCE(SUM(subtotal), 0) as total
     FROM invoices
     WHERE tenant_id = $1 AND customer_id = $2 AND status != '取消'
     GROUP BY billing_month
     ORDER BY billing_month DESC
     LIMIT $3`,
    [tenantId, customerId, months]
  );
  return rows.map((r) => ({ billingMonth: r.billingMonth, totalAmount: Number(r.total) })).reverse();
}

export interface AnnualCustomerRanking {
  customerId: string;
  customerName: string;
  totalAmount: number;
  invoiceCount: number;
}

export interface AnnualReport {
  year: number;
  totalRevenue: number;
  totalGrossProfit: number;
  totalOperatingProfit: number;
  invoiceCount: number;
  topCustomers: AnnualCustomerRanking[];
}

export async function getAnnualReport(tenantId: string, year: number, topN = 10): Promise<AnnualReport> {
  const yearLike = `${year}-%`;

  const totalsRow = await queryOne<{ revenue: string; gp: string; op: string; cnt: string }>(
    `SELECT COALESCE(SUM(subtotal),0) as revenue, COALESCE(SUM(gross_profit),0) as gp,
      COALESCE(SUM(operating_profit),0) as op, COUNT(*) as cnt
     FROM invoices
     WHERE tenant_id = $1 AND billing_month LIKE $2 AND status != '取消'`,
    [tenantId, yearLike]
  );

  const topCustomers = await query<AnnualCustomerRanking>(
    `SELECT i.customer_id as "customerId", c.name as "customerName",
      COALESCE(SUM(i.subtotal), 0) as "totalAmount", COUNT(*) as "invoiceCount"
     FROM invoices i
     LEFT JOIN customers c ON c.id = i.customer_id
     WHERE i.tenant_id = $1 AND i.billing_month LIKE $2 AND i.status != '取消'
     GROUP BY i.customer_id, c.name
     ORDER BY "totalAmount" DESC
     LIMIT $3`,
    [tenantId, yearLike, topN]
  );

  return {
    year,
    totalRevenue: Number(totalsRow?.revenue ?? 0),
    totalGrossProfit: Number(totalsRow?.gp ?? 0),
    totalOperatingProfit: Number(totalsRow?.op ?? 0),
    invoiceCount: Number(totalsRow?.cnt ?? 0),
    topCustomers: topCustomers.map((c) => ({ ...c, totalAmount: Number(c.totalAmount), invoiceCount: Number(c.invoiceCount) })),
  };
}

export async function listAnnualInvoices(tenantId: string, year: number) {
  const yearLike = `${year}-%`;
  return query(
    `SELECT i.invoice_no as "invoiceNo", c.name as "customerName", i.billing_month as "billingMonth",
      i.invoice_date as "invoiceDate", i.subtotal, i.tax_amount as "taxAmount", i.total_amount as "totalAmount",
      i.gross_profit as "grossProfit", i.status, i.paid_date as "paidDate"
     FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id
     WHERE i.tenant_id = $1 AND i.billing_month LIKE $2 AND i.status != '取消'
     ORDER BY i.billing_month ASC, i.invoice_no ASC`,
    [tenantId, yearLike]
  );
}
