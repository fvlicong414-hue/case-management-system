import { query, queryOne } from "./client";
import { getSettings } from "./settings";

export interface DashboardData {
  customerCount: number;
  projectCount: number;
  monthEstimateSubmitted: number;
  monthOrderedAmount: number;
  monthBillingScheduled: number;
  monthBilled: number;
  monthGrossProfit: number;
  monthOperatingProfit: number;
  monthActualOperatingProfit: number | null;
  unbilledCount: number;
  waitingPaymentCount: number;
  issuedNotSentCount: number;
  unpaidCustomers: { customerId: string; customerName: string; unpaidAmount: number; invoiceCount: number }[];
  overdueInvoices: { id: string; invoiceNo: string; customerName: string; totalAmount: number; paymentDueDate: string }[];
  lowMarginProjects: { id: string; projectName: string; customerName: string; grossProfitRate: number; salesTotal: number }[];
  recentEstimates: { id: string; estimateNo: string; customerName: string; salesTotal: number; status: string; estimateDate: string }[];
  recentInvoices: { id: string; invoiceNo: string; customerName: string; totalAmount: number; status: string; invoiceDate: string }[];
}

export async function getDashboardData(tenantId: string): Promise<DashboardData> {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLikeDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-%`;
  const today = now.toISOString().slice(0, 10);

  const customerCount = Number(
    (await queryOne<{ c: string }>("SELECT COUNT(*) as c FROM customers WHERE tenant_id = $1 AND is_active = true", [
      tenantId,
    ]))?.c ?? 0
  );
  const projectCount = Number(
    (await queryOne<{ c: string }>("SELECT COUNT(*) as c FROM projects WHERE tenant_id = $1", [tenantId]))?.c ?? 0
  );

  const monthEstimateSubmitted = Number(
    (
      await queryOne<{ s: string }>(
        `SELECT COALESCE(SUM(sales_total),0) as s FROM estimates
         WHERE tenant_id = $1 AND status IN ('提出済','受注','失注') AND estimate_date LIKE $2`,
        [tenantId, monthLikeDate]
      )
    )?.s ?? 0
  );

  const monthOrderedAmount = Number(
    (
      await queryOne<{ s: string }>(
        `SELECT COALESCE(SUM(sales_total),0) as s FROM estimates
         WHERE tenant_id = $1 AND status = '受注' AND estimate_date LIKE $2`,
        [tenantId, monthLikeDate]
      )
    )?.s ?? 0
  );

  const monthBillingScheduled = Number(
    (
      await queryOne<{ s: string }>(
        `SELECT COALESCE(SUM(scheduled_amount),0) as s FROM billing_schedules
         WHERE tenant_id = $1 AND billing_month = $2 AND status != '取消'`,
        [tenantId, yyyymm]
      )
    )?.s ?? 0
  );

  const monthBilledRow = await queryOne<{ subtotal: string; gp: string; op: string }>(
    `SELECT COALESCE(SUM(subtotal),0) as subtotal, COALESCE(SUM(gross_profit),0) as gp,
      COALESCE(SUM(operating_profit),0) as op
     FROM invoices WHERE tenant_id = $1 AND billing_month = $2 AND status != '取消'`,
    [tenantId, yyyymm]
  );

  const unbilledCount = Number(
    (
      await queryOne<{ c: string }>("SELECT COUNT(*) as c FROM billing_schedules WHERE tenant_id = $1 AND status = '未請求'", [
        tenantId,
      ])
    )?.c ?? 0
  );

  const waitingPaymentCount = Number(
    (
      await queryOne<{ c: string }>(
        "SELECT COUNT(*) as c FROM invoices WHERE tenant_id = $1 AND status IN ('発行済','送付済')",
        [tenantId]
      )
    )?.c ?? 0
  );

  const issuedNotSentCount = Number(
    (
      await queryOne<{ c: string }>("SELECT COUNT(*) as c FROM invoices WHERE tenant_id = $1 AND status = '発行済'", [
        tenantId,
      ])
    )?.c ?? 0
  );

  const unpaidCustomers = await query(
    `SELECT i.customer_id as "customerId", c.name as "customerName",
      COALESCE(SUM(i.total_amount), 0) as "unpaidAmount", COUNT(*) as "invoiceCount"
     FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id
     WHERE i.tenant_id = $1 AND i.status IN ('発行済','送付済')
     GROUP BY i.customer_id, c.name
     ORDER BY "unpaidAmount" DESC`,
    [tenantId]
  );

  const overdueInvoices = await query(
    `SELECT i.id, i.invoice_no as "invoiceNo", c.name as "customerName", i.total_amount as "totalAmount",
      i.payment_due_date as "paymentDueDate"
     FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id
     WHERE i.tenant_id = $1 AND i.status IN ('発行済','送付済') AND i.payment_due_date < $2
     ORDER BY i.payment_due_date ASC LIMIT 10`,
    [tenantId, today]
  );

  const lowMarginProjects = await query(
    `SELECT p.id, p.project_name as "projectName", c.name as "customerName",
      e.gross_profit_rate as "grossProfitRate", e.sales_total as "salesTotal"
     FROM estimates e
     LEFT JOIN projects p ON p.id = e.project_id
     LEFT JOIN customers c ON c.id = e.customer_id
     WHERE e.tenant_id = $1 AND e.status = '受注' AND e.sales_total > 0
     ORDER BY e.gross_profit_rate ASC LIMIT 5`,
    [tenantId]
  );

  const recentEstimates = await query(
    `SELECT e.id, e.estimate_no as "estimateNo", c.name as "customerName", e.sales_total as "salesTotal",
      e.status, e.estimate_date as "estimateDate"
     FROM estimates e LEFT JOIN customers c ON c.id = e.customer_id
     WHERE e.tenant_id = $1 ORDER BY e.created_at DESC LIMIT 5`,
    [tenantId]
  );

  const recentInvoices = await query(
    `SELECT i.id, i.invoice_no as "invoiceNo", c.name as "customerName", i.total_amount as "totalAmount",
      i.status, i.invoice_date as "invoiceDate"
     FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id
     WHERE i.tenant_id = $1 ORDER BY i.created_at DESC LIMIT 5`,
    [tenantId]
  );

  const settings = await getSettings(tenantId);
  const monthActualOperatingProfit =
    settings.monthlyFixedCost > 0 ? Number(monthBilledRow?.gp ?? 0) - settings.monthlyFixedCost : null;

  return {
    customerCount,
    projectCount,
    monthEstimateSubmitted,
    monthOrderedAmount,
    monthBillingScheduled,
    monthBilled: Number(monthBilledRow?.subtotal ?? 0),
    monthGrossProfit: Number(monthBilledRow?.gp ?? 0),
    monthOperatingProfit: Number(monthBilledRow?.op ?? 0),
    monthActualOperatingProfit,
    unbilledCount,
    waitingPaymentCount,
    issuedNotSentCount,
    unpaidCustomers: unpaidCustomers.map((u: any) => ({
      ...u,
      unpaidAmount: Number(u.unpaidAmount),
      invoiceCount: Number(u.invoiceCount),
    })),
    overdueInvoices: overdueInvoices as any,
    lowMarginProjects: lowMarginProjects as any,
    recentEstimates: recentEstimates as any,
    recentInvoices: recentInvoices as any,
  };
}
