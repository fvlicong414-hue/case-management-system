import { query, queryOne, generateId, nowIso } from "./client";
import type { Estimate, EstimateItem } from "./types";
import { generateNumber } from "./numbering";
import { getSettings } from "./settings";
import { calcLine, calcEstimateTotals } from "../calc";

const EST_COLS = `id, tenant_id as "tenantId", estimate_no as "estimateNo", project_id as "projectId",
  customer_id as "customerId", estimate_date as "estimateDate", title, status, version,
  original_estimate_id as "originalEstimateId", sales_total as "salesTotal", cost_total as "costTotal",
  gross_profit as "grossProfit", gross_profit_rate as "grossProfitRate", overhead_rate as "overheadRate",
  overhead_amount as "overheadAmount", operating_profit as "operatingProfit", tax_amount as "taxAmount",
  total_with_tax as "totalWithTax", memo, created_by as "createdBy", created_at as "createdAt",
  updated_at as "updatedAt"`;

const ITEM_COLS = `id, tenant_id as "tenantId", estimate_id as "estimateId", item_master_id as "itemMasterId",
  item_name as "itemName", specification, quantity, unit, sales_unit_price as "salesUnitPrice",
  sales_amount as "salesAmount", cost_unit_price as "costUnitPrice", cost_amount as "costAmount",
  gross_profit as "grossProfit", memo, sort_order as "sortOrder", created_at as "createdAt",
  updated_at as "updatedAt"`;

export interface EstimateSearch {
  estimateNo?: string;
  projectName?: string;
  customerName?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listEstimates(
  tenantId: string,
  search: EstimateSearch = {}
): Promise<(Estimate & { projectName?: string; customerName?: string })[]> {
  const clauses = ["e.tenant_id = $1"];
  const params: any[] = [tenantId];
  let i = 2;
  if (search.estimateNo) {
    clauses.push(`e.estimate_no ILIKE $${i++}`);
    params.push(`%${search.estimateNo}%`);
  }
  if (search.projectName) {
    clauses.push(`p.project_name ILIKE $${i++}`);
    params.push(`%${search.projectName}%`);
  }
  if (search.customerName) {
    clauses.push(`c.name ILIKE $${i++}`);
    params.push(`%${search.customerName}%`);
  }
  if (search.status) {
    clauses.push(`e.status = $${i++}`);
    params.push(search.status);
  }
  if (search.dateFrom) {
    clauses.push(`e.estimate_date >= $${i++}`);
    params.push(search.dateFrom);
  }
  if (search.dateTo) {
    clauses.push(`e.estimate_date <= $${i++}`);
    params.push(search.dateTo);
  }
  const sql = `SELECT e.id, e.tenant_id as "tenantId", e.estimate_no as "estimateNo", e.project_id as "projectId",
      e.customer_id as "customerId", e.estimate_date as "estimateDate", e.title, e.status, e.version,
      e.original_estimate_id as "originalEstimateId", e.sales_total as "salesTotal", e.cost_total as "costTotal",
      e.gross_profit as "grossProfit", e.gross_profit_rate as "grossProfitRate", e.overhead_rate as "overheadRate",
      e.overhead_amount as "overheadAmount", e.operating_profit as "operatingProfit", e.tax_amount as "taxAmount",
      e.total_with_tax as "totalWithTax", e.memo, e.created_by as "createdBy", e.created_at as "createdAt",
      e.updated_at as "updatedAt", p.project_name as "projectName", c.name as "customerName"
    FROM estimates e
    LEFT JOIN projects p ON p.id = e.project_id
    LEFT JOIN customers c ON c.id = e.customer_id
    WHERE ${clauses.join(" AND ")}
    ORDER BY e.created_at DESC`;
  return query(sql, params);
}

export async function getEstimate(id: string): Promise<Estimate | undefined> {
  return queryOne<Estimate>(`SELECT ${EST_COLS} FROM estimates WHERE id = $1`, [id]);
}

export async function listEstimatesByProject(projectId: string): Promise<Estimate[]> {
  return query<Estimate>(`SELECT ${EST_COLS} FROM estimates WHERE project_id = $1 ORDER BY version DESC`, [
    projectId,
  ]);
}

export async function listEstimateItems(estimateId: string): Promise<EstimateItem[]> {
  return query<EstimateItem>(`SELECT ${ITEM_COLS} FROM estimate_items WHERE estimate_id = $1 ORDER BY sort_order ASC`, [
    estimateId,
  ]);
}

export async function createEstimate(
  tenantId: string,
  input: { projectId: string; customerId: string; estimateDate: string; title?: string; memo?: string; createdBy?: string }
): Promise<Estimate> {
  const id = generateId();
  const now = nowIso();
  const settings = await getSettings(tenantId);
  const estimateNo = await generateNumber("estimates", "estimate_no", tenantId, settings.estimateNumberPrefix);
  await query(
    `INSERT INTO estimates (id, tenant_id, estimate_no, project_id, customer_id, estimate_date, title,
      status, version, sales_total, cost_total, gross_profit, gross_profit_rate, overhead_rate,
      overhead_amount, operating_profit, tax_amount, total_with_tax, memo, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, '作成中', 1, 0, 0, 0, 0, $8, 0, 0, 0, 0, $9, $10, $11, $12)`,
    [
      id,
      tenantId,
      estimateNo,
      input.projectId,
      input.customerId,
      input.estimateDate,
      input.title ?? null,
      settings.overheadRate,
      input.memo ?? null,
      input.createdBy ?? null,
      now,
      now,
    ]
  );
  return (await getEstimate(id))!;
}

function assertEditable(estimate: Estimate) {
  if (estimate.status !== "作成中") {
    throw new Error("提出済・受注・失注・取消の見積は編集できません。複製して新版を作成してください。");
  }
}

export async function updateEstimateHeader(
  id: string,
  input: Partial<Pick<Estimate, "title" | "estimateDate" | "memo">>
): Promise<Estimate> {
  const current = await getEstimate(id);
  if (!current) throw new Error("見積が見つかりません");
  assertEditable(current);
  const now = nowIso();
  const merged = { ...current, ...input };
  await query(`UPDATE estimates SET title = $1, estimate_date = $2, memo = $3, updated_at = $4 WHERE id = $5`, [
    merged.title,
    merged.estimateDate,
    merged.memo,
    now,
    id,
  ]);
  return (await getEstimate(id))!;
}

export async function addEstimateItem(
  estimateId: string,
  input: {
    itemMasterId?: string | null;
    itemName: string;
    specification?: string | null;
    quantity: number;
    unit?: string | null;
    salesUnitPrice: number;
    costUnitPrice: number;
    memo?: string | null;
  }
): Promise<EstimateItem> {
  const estimate = await getEstimate(estimateId);
  if (!estimate) throw new Error("見積が見つかりません");
  assertEditable(estimate);
  const id = generateId();
  const now = nowIso();
  const totals = calcLine(input.quantity, input.salesUnitPrice, input.costUnitPrice);
  const maxOrderRow = await queryOne<{ m: number }>(
    "SELECT COALESCE(MAX(sort_order), -1) as m FROM estimate_items WHERE estimate_id = $1",
    [estimateId]
  );
  await query(
    `INSERT INTO estimate_items (id, tenant_id, estimate_id, item_master_id, item_name, specification,
      quantity, unit, sales_unit_price, sales_amount, cost_unit_price, cost_amount, gross_profit, memo,
      sort_order, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [
      id,
      estimate.tenantId,
      estimateId,
      input.itemMasterId ?? null,
      input.itemName,
      input.specification ?? null,
      input.quantity,
      input.unit ?? null,
      input.salesUnitPrice,
      totals.salesAmount,
      input.costUnitPrice,
      totals.costAmount,
      totals.grossProfit,
      input.memo ?? null,
      Number(maxOrderRow?.m ?? -1) + 1,
      now,
      now,
    ]
  );
  await recalcEstimateTotals(estimateId);
  return (await queryOne<EstimateItem>(`SELECT ${ITEM_COLS} FROM estimate_items WHERE id = $1`, [id]))!;
}

export async function updateEstimateItem(
  itemId: string,
  input: Partial<{
    itemName: string;
    specification: string | null;
    quantity: number;
    unit: string | null;
    salesUnitPrice: number;
    costUnitPrice: number;
    memo: string | null;
    sortOrder: number;
  }>
): Promise<EstimateItem> {
  const current = await queryOne<EstimateItem>(`SELECT ${ITEM_COLS} FROM estimate_items WHERE id = $1`, [itemId]);
  if (!current) throw new Error("見積明細が見つかりません");
  const estimate = await getEstimate(current.estimateId);
  if (!estimate) throw new Error("見積が見つかりません");
  assertEditable(estimate);
  const merged = { ...current, ...input };
  const totals = calcLine(merged.quantity, merged.salesUnitPrice, merged.costUnitPrice);
  const now = nowIso();
  await query(
    `UPDATE estimate_items SET item_name = $1, specification = $2, quantity = $3, unit = $4,
      sales_unit_price = $5, sales_amount = $6, cost_unit_price = $7, cost_amount = $8, gross_profit = $9,
      memo = $10, sort_order = $11, updated_at = $12 WHERE id = $13`,
    [
      merged.itemName,
      merged.specification,
      merged.quantity,
      merged.unit,
      merged.salesUnitPrice,
      totals.salesAmount,
      merged.costUnitPrice,
      totals.costAmount,
      totals.grossProfit,
      merged.memo,
      merged.sortOrder,
      now,
      itemId,
    ]
  );
  await recalcEstimateTotals(current.estimateId);
  return (await queryOne<EstimateItem>(`SELECT ${ITEM_COLS} FROM estimate_items WHERE id = $1`, [itemId]))!;
}

export async function deleteEstimateItem(itemId: string): Promise<void> {
  const current = await queryOne<EstimateItem>(`SELECT ${ITEM_COLS} FROM estimate_items WHERE id = $1`, [itemId]);
  if (!current) return;
  const estimate = await getEstimate(current.estimateId);
  if (!estimate) return;
  assertEditable(estimate);
  await query("DELETE FROM estimate_items WHERE id = $1", [itemId]);
  await recalcEstimateTotals(current.estimateId);
}

export async function recalcEstimateTotals(estimateId: string): Promise<Estimate> {
  const estimate = await getEstimate(estimateId);
  if (!estimate) throw new Error("見積が見つかりません");
  const items = await listEstimateItems(estimateId);
  const settings = await getSettings(estimate.tenantId);
  const totals = calcEstimateTotals(items, estimate.overheadRate ?? settings.overheadRate, settings.taxRate);
  const now = nowIso();
  await query(
    `UPDATE estimates SET sales_total = $1, cost_total = $2, gross_profit = $3, gross_profit_rate = $4,
      overhead_amount = $5, operating_profit = $6, tax_amount = $7, total_with_tax = $8, updated_at = $9
      WHERE id = $10`,
    [
      totals.salesTotal,
      totals.costTotal,
      totals.grossProfit,
      totals.grossProfitRate,
      totals.overheadAmount,
      totals.operatingProfit,
      totals.taxAmount,
      totals.totalWithTax,
      now,
      estimateId,
    ]
  );
  return (await getEstimate(estimateId))!;
}

/** 見積ステータス遷移: 提出済にする */
export async function submitEstimate(id: string): Promise<Estimate> {
  const estimate = await getEstimate(id);
  if (!estimate) throw new Error("見積が見つかりません");
  if (estimate.status !== "作成中") throw new Error("作成中の見積のみ提出済にできます");
  const items = await listEstimateItems(id);
  if (items.length === 0) throw new Error("明細が1件もない見積は提出できません");
  return setEstimateStatus(id, "提出済");
}

export async function markEstimateOrdered(id: string): Promise<Estimate> {
  const estimate = await getEstimate(id);
  if (!estimate) throw new Error("見積が見つかりません");
  if (estimate.status !== "提出済") throw new Error("提出済の見積のみ受注にできます");
  return setEstimateStatus(id, "受注");
}

export async function markEstimateLost(id: string): Promise<Estimate> {
  const estimate = await getEstimate(id);
  if (!estimate) throw new Error("見積が見つかりません");
  if (estimate.status !== "提出済") throw new Error("提出済の見積のみ失注にできます");
  return setEstimateStatus(id, "失注");
}

export async function cancelEstimate(id: string): Promise<Estimate> {
  return setEstimateStatus(id, "取消");
}

async function setEstimateStatus(id: string, status: Estimate["status"]): Promise<Estimate> {
  const now = nowIso();
  await query("UPDATE estimates SET status = $1, updated_at = $2 WHERE id = $3", [status, now, id]);
  return (await getEstimate(id))!;
}

/** 提出済見積を複製して新版(version+1)を作成する */
export async function duplicateEstimateAsNewVersion(id: string, createdBy?: string): Promise<Estimate> {
  const original = await getEstimate(id);
  if (!original) throw new Error("見積が見つかりません");
  if (original.status !== "提出済") {
    throw new Error("提出済の見積のみ複製して新版を作成できます");
  }
  const rootId = original.originalEstimateId ?? original.id;
  const newId = generateId();
  const now = nowIso();
  const newEstimateNo = `${original.estimateNo.split("-v")[0]}-v${original.version + 1}`;
  await query(
    `INSERT INTO estimates (id, tenant_id, estimate_no, project_id, customer_id, estimate_date, title,
      status, version, original_estimate_id, sales_total, cost_total, gross_profit, gross_profit_rate,
      overhead_rate, overhead_amount, operating_profit, tax_amount, total_with_tax, memo, created_by,
      created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, '作成中', $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
    [
      newId,
      original.tenantId,
      newEstimateNo,
      original.projectId,
      original.customerId,
      original.estimateDate,
      original.title,
      original.version + 1,
      rootId,
      original.salesTotal,
      original.costTotal,
      original.grossProfit,
      original.grossProfitRate,
      original.overheadRate,
      original.overheadAmount,
      original.operatingProfit,
      original.taxAmount,
      original.totalWithTax,
      original.memo,
      createdBy ?? original.createdBy,
      now,
      now,
    ]
  );
  const items = await listEstimateItems(id);
  for (const item of items) {
    const itemId = generateId();
    await query(
      `INSERT INTO estimate_items (id, tenant_id, estimate_id, item_master_id, item_name, specification,
        quantity, unit, sales_unit_price, sales_amount, cost_unit_price, cost_amount, gross_profit, memo,
        sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        itemId,
        original.tenantId,
        newId,
        item.itemMasterId,
        item.itemName,
        item.specification,
        item.quantity,
        item.unit,
        item.salesUnitPrice,
        item.salesAmount,
        item.costUnitPrice,
        item.costAmount,
        item.grossProfit,
        item.memo,
        item.sortOrder,
        now,
        now,
      ]
    );
  }
  return (await getEstimate(newId))!;
}
