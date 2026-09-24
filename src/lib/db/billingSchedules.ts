import { query, queryOne, generateId, nowIso } from "./client";
import type { BillingSchedule, BillingType } from "./types";
import { getEstimate } from "./estimates";
import { allocateCost, round2 } from "../calc";

const COLS = `id, tenant_id as "tenantId", estimate_id as "estimateId", project_id as "projectId",
  customer_id as "customerId", billing_month as "billingMonth", billing_type as "billingType",
  scheduled_amount as "scheduledAmount", cost_allocated as "costAllocated", gross_profit as "grossProfit",
  status, invoice_id as "invoiceId", memo, created_at as "createdAt", updated_at as "updatedAt"`;

export async function getBillingSchedule(id: string): Promise<BillingSchedule | undefined> {
  return queryOne<BillingSchedule>(`SELECT ${COLS} FROM billing_schedules WHERE id = $1`, [id]);
}

export async function listBillingSchedulesByEstimate(estimateId: string): Promise<BillingSchedule[]> {
  return query<BillingSchedule>(
    `SELECT ${COLS} FROM billing_schedules WHERE estimate_id = $1 ORDER BY billing_month ASC`,
    [estimateId]
  );
}

export interface BillingScheduleSearch {
  customerName?: string;
  billingMonth?: string;
  status?: string;
}

export async function listBillingSchedules(
  tenantId: string,
  search: BillingScheduleSearch = {}
): Promise<(BillingSchedule & { customerName?: string; projectName?: string; siteName?: string; estimateNo?: string })[]> {
  const clauses = ["b.tenant_id = $1"];
  const params: any[] = [tenantId];
  let i = 2;
  if (search.customerName) {
    clauses.push(`c.name ILIKE $${i++}`);
    params.push(`%${search.customerName}%`);
  }
  if (search.billingMonth) {
    clauses.push(`b.billing_month = $${i++}`);
    params.push(search.billingMonth);
  }
  if (search.status) {
    clauses.push(`b.status = $${i++}`);
    params.push(search.status);
  }
  const sql = `SELECT b.id, b.tenant_id as "tenantId", b.estimate_id as "estimateId", b.project_id as "projectId",
      b.customer_id as "customerId", b.billing_month as "billingMonth", b.billing_type as "billingType",
      b.scheduled_amount as "scheduledAmount", b.cost_allocated as "costAllocated", b.gross_profit as "grossProfit",
      b.status, b.invoice_id as "invoiceId", b.memo, b.created_at as "createdAt", b.updated_at as "updatedAt",
      c.name as "customerName", p.project_name as "projectName", p.site_name as "siteName", e.estimate_no as "estimateNo"
    FROM billing_schedules b
    LEFT JOIN customers c ON c.id = b.customer_id
    LEFT JOIN projects p ON p.id = b.project_id
    LEFT JOIN estimates e ON e.id = b.estimate_id
    WHERE ${clauses.join(" AND ")}
    ORDER BY b.billing_month ASC, b.created_at ASC`;
  return query(sql, params);
}

/**
 * 未請求の請求予定を顧客・請求月で絞り込む(月次請求作成画面用)。
 * 「指定した月」だけでなく「それ以前の月で請求し忘れている分」も自動的に対象へ含める(月次自動繰越)。
 */
export async function listUnbilledSchedules(
  tenantId: string,
  customerId: string,
  billingMonth: string
): Promise<(BillingSchedule & { projectName?: string; siteName?: string; estimateNo?: string })[]> {
  const sql = `SELECT b.id, b.tenant_id as "tenantId", b.estimate_id as "estimateId", b.project_id as "projectId",
      b.customer_id as "customerId", b.billing_month as "billingMonth", b.billing_type as "billingType",
      b.scheduled_amount as "scheduledAmount", b.cost_allocated as "costAllocated", b.gross_profit as "grossProfit",
      b.status, b.invoice_id as "invoiceId", b.memo, b.created_at as "createdAt", b.updated_at as "updatedAt",
      p.project_name as "projectName", p.site_name as "siteName", e.estimate_no as "estimateNo"
    FROM billing_schedules b
    LEFT JOIN projects p ON p.id = b.project_id
    LEFT JOIN estimates e ON e.id = b.estimate_id
    WHERE b.tenant_id = $1 AND b.customer_id = $2 AND b.billing_month <= $3 AND b.status = '未請求'
      AND b.invoice_id IS NULL
    ORDER BY b.billing_month ASC, p.project_name ASC`;
  return query(sql, [tenantId, customerId, billingMonth]);
}

/**
 * 受注済見積から請求予定を作成する。
 * schedules: [{ billingType, billingMonth, scheduledAmount }]
 * 通常請求は1件、分割請求は複数件を渡す。
 * 原価は請求予定額の比率で自動按分(手動修正も別途 updateBillingScheduleCost で可能)。
 */
export async function createBillingSchedules(
  input: {
    estimateId: string;
    schedules: { billingType: BillingType; billingMonth: string; scheduledAmount: number; memo?: string }[];
  },
  options: { allowMismatch?: boolean } = {}
): Promise<{ schedules: BillingSchedule[]; warning?: string }> {
  const estimate = await getEstimate(input.estimateId);
  if (!estimate) throw new Error("見積が見つかりません");
  if (estimate.status !== "受注") throw new Error("受注済の見積のみ請求予定を作成できます");
  if (input.schedules.length === 0) throw new Error("請求予定を1件以上入力してください");

  const totalScheduled = round2(input.schedules.reduce((s, x) => s + x.scheduledAmount, 0));
  let warning: string | undefined;
  if (Math.abs(totalScheduled - estimate.salesTotal) > 0.5) {
    warning = `請求予定合計(${totalScheduled}円)が見積金額(${estimate.salesTotal}円)と一致しません`;
    if (!options.allowMismatch) {
      throw new Error(warning + "。差異を確認のうえ、管理者権限で保存してください。");
    }
  }

  const costAllocations = allocateCost(
    input.schedules.map((s) => s.scheduledAmount),
    estimate.costTotal
  );

  const now = nowIso();
  const created: BillingSchedule[] = [];
  for (let idx = 0; idx < input.schedules.length; idx++) {
    const s = input.schedules[idx];
    const id = generateId();
    const costAllocated = costAllocations[idx];
    const grossProfit = round2(s.scheduledAmount - costAllocated);
    await query(
      `INSERT INTO billing_schedules (id, tenant_id, estimate_id, project_id, customer_id, billing_month,
        billing_type, scheduled_amount, cost_allocated, gross_profit, status, memo, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, '未請求', $11, $12, $13)`,
      [
        id,
        estimate.tenantId,
        estimate.id,
        estimate.projectId,
        estimate.customerId,
        s.billingMonth,
        s.billingType,
        s.scheduledAmount,
        costAllocated,
        grossProfit,
        s.memo ?? null,
        now,
        now,
      ]
    );
    created.push((await getBillingSchedule(id))!);
  }
  return { schedules: created, warning };
}

export async function updateBillingScheduleCost(id: string, costAllocated: number): Promise<BillingSchedule> {
  const current = await getBillingSchedule(id);
  if (!current) throw new Error("請求予定が見つかりません");
  const grossProfit = round2(current.scheduledAmount - costAllocated);
  const now = nowIso();
  await query("UPDATE billing_schedules SET cost_allocated = $1, gross_profit = $2, updated_at = $3 WHERE id = $4", [
    costAllocated,
    grossProfit,
    now,
    id,
  ]);
  return (await getBillingSchedule(id))!;
}

export async function setBillingScheduleStatus(
  id: string,
  status: BillingSchedule["status"],
  invoiceId?: string | null
): Promise<BillingSchedule> {
  const now = nowIso();
  await query("UPDATE billing_schedules SET status = $1, invoice_id = $2, updated_at = $3 WHERE id = $4", [
    status,
    invoiceId ?? null,
    now,
    id,
  ]);
  return (await getBillingSchedule(id))!;
}

/** 請求書取消時に、関連する請求予定を未請求に戻す */
export async function resetBillingSchedulesForInvoice(invoiceId: string): Promise<void> {
  const now = nowIso();
  await query(
    "UPDATE billing_schedules SET status = '未請求', invoice_id = NULL, updated_at = $1 WHERE invoice_id = $2",
    [now, invoiceId]
  );
}

export async function markBillingSchedulesPaid(invoiceId: string): Promise<void> {
  const now = nowIso();
  await query("UPDATE billing_schedules SET status = '入金済', updated_at = $1 WHERE invoice_id = $2", [
    now,
    invoiceId,
  ]);
}

/**
 * 既存の請求予定(未請求のもののみ)に、追加工事(+)や未使用部材の削減(-)などの
 * 調整行を1件だけ追加する。合計金額と見積金額の一致チェックは行わない
 * (確定後の運用上の調整のため)。
 */
export async function addSingleBillingSchedule(
  estimateId: string,
  input: { billingType: BillingType; billingMonth: string; scheduledAmount: number; memo?: string }
): Promise<BillingSchedule> {
  const estimate = await getEstimate(estimateId);
  if (!estimate) throw new Error("見積が見つかりません");
  const id = generateId();
  const now = nowIso();
  // 原価は金額の比率がわからないため0円按分とし、必要に応じて後から updateBillingScheduleCost で調整する
  await query(
    `INSERT INTO billing_schedules (id, tenant_id, estimate_id, project_id, customer_id, billing_month,
      billing_type, scheduled_amount, cost_allocated, gross_profit, status, memo, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $8, '未請求', $9, $10, $11)`,
    [
      id,
      estimate.tenantId,
      estimate.id,
      estimate.projectId,
      estimate.customerId,
      input.billingMonth,
      input.billingType,
      input.scheduledAmount,
      input.memo ?? null,
      now,
      now,
    ]
  );
  return (await getBillingSchedule(id))!;
}

/** 未請求の請求予定の金額を編集する(送付前の調整用) */
export async function updateBillingScheduleAmount(
  id: string,
  input: { billingType?: BillingType; billingMonth?: string; scheduledAmount: number }
): Promise<BillingSchedule> {
  const current = await getBillingSchedule(id);
  if (!current) throw new Error("請求予定が見つかりません");
  if (current.status !== "未請求" || current.invoiceId) {
    throw new Error("請求済の請求予定は編集できません");
  }
  const now = nowIso();
  const grossProfit = round2(input.scheduledAmount - current.costAllocated);
  await query(
    `UPDATE billing_schedules SET billing_type = $1, billing_month = $2, scheduled_amount = $3,
      gross_profit = $4, updated_at = $5 WHERE id = $6`,
    [
      input.billingType ?? current.billingType,
      input.billingMonth ?? current.billingMonth,
      input.scheduledAmount,
      grossProfit,
      now,
      id,
    ]
  );
  return (await getBillingSchedule(id))!;
}

/** 未請求の請求予定を削除する */
export async function deleteBillingSchedule(id: string): Promise<void> {
  const current = await getBillingSchedule(id);
  if (!current) return;
  if (current.status !== "未請求" || current.invoiceId) {
    throw new Error("請求済の請求予定は削除できません");
  }
  await query(`DELETE FROM billing_schedules WHERE id = $1`, [id]);
}

/**
 * 案件が完了になった際、受注済み見積のうちまだ請求予定が1件も作られていないものについて、
 * 見積金額をそのまま「出来高」区分・当月請求で自動的に請求予定へ反映する(手打ちの解消)。
 * 既に請求予定がある見積はスキップする(重複作成防止)。
 */
export async function autoCreateBillingSchedulesForProject(
  tenantId: string,
  projectId: string
): Promise<{ createdCount: number }> {
  const estimates = await query<{ id: string; salesTotal: number; costTotal: number }>(
    `SELECT id, sales_total as "salesTotal", cost_total as "costTotal" FROM estimates
     WHERE tenant_id = $1 AND project_id = $2 AND status = '受注'`,
    [tenantId, projectId]
  );
  const currentMonth = new Date().toISOString().slice(0, 7);
  let createdCount = 0;
  for (const est of estimates) {
    const existing = await query(`SELECT id FROM billing_schedules WHERE estimate_id = $1 LIMIT 1`, [est.id]);
    if (existing.length > 0) continue;
    if (!est.salesTotal || est.salesTotal <= 0) continue;
    const result = await createBillingSchedules(
      {
        estimateId: est.id,
        schedules: [{ billingType: "出来高", billingMonth: currentMonth, scheduledAmount: est.salesTotal }],
      },
      { allowMismatch: true }
    );
    createdCount += result.schedules.length;
  }
  return { createdCount };
}
