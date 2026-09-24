import { query, queryOne, generateId, nowIso } from "./client";

export type PurchaseOrderType = "発注書" | "見積依頼書";
export type PurchaseOrderStatus = "下書き" | "発行済" | "送付済" | "回答待ち" | "完了" | "取消";

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  orderNo: string;
  orderType: PurchaseOrderType;
  supplierName: string;
  projectId: string | null;
  title: string | null;
  orderDate: string;
  status: PurchaseOrderStatus;
  memo: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  tenantId: string;
  purchaseOrderId: string;
  itemCode: string | null;
  itemName: string;
  specification: string | null;
  quantity: number;
  unit: string | null;
  memo: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const PO_COLS = `id, tenant_id as "tenantId", order_no as "orderNo", order_type as "orderType",
  supplier_name as "supplierName", project_id as "projectId", title, order_date as "orderDate",
  status, memo, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"`;

const ITEM_COLS = `id, tenant_id as "tenantId", purchase_order_id as "purchaseOrderId", item_code as "itemCode",
  item_name as "itemName", specification, quantity, unit, memo, sort_order as "sortOrder",
  created_at as "createdAt", updated_at as "updatedAt"`;

export interface PurchaseOrderSearch {
  supplierName?: string;
  status?: string;
  orderType?: string;
}

export async function listPurchaseOrders(
  tenantId: string,
  search: PurchaseOrderSearch = {}
): Promise<(PurchaseOrder & { projectName?: string })[]> {
  const clauses = ["po.tenant_id = $1"];
  const params: any[] = [tenantId];
  let i = 2;
  if (search.supplierName) {
    clauses.push(`po.supplier_name ILIKE $${i++}`);
    params.push(`%${search.supplierName}%`);
  }
  if (search.status) {
    clauses.push(`po.status = $${i++}`);
    params.push(search.status);
  }
  if (search.orderType) {
    clauses.push(`po.order_type = $${i++}`);
    params.push(search.orderType);
  }
  const sql = `SELECT po.id, po.tenant_id as "tenantId", po.order_no as "orderNo", po.order_type as "orderType",
      po.supplier_name as "supplierName", po.project_id as "projectId", po.title, po.order_date as "orderDate",
      po.status, po.memo, po.created_by as "createdBy", po.created_at as "createdAt", po.updated_at as "updatedAt",
      p.project_name as "projectName"
    FROM purchase_orders po
    LEFT JOIN projects p ON p.id = po.project_id
    WHERE ${clauses.join(" AND ")}
    ORDER BY po.created_at DESC`;
  return query(sql, params);
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
  return queryOne<PurchaseOrder>(`SELECT ${PO_COLS} FROM purchase_orders WHERE id = $1`, [id]);
}

export async function listPurchaseOrderItems(purchaseOrderId: string): Promise<PurchaseOrderItem[]> {
  return query<PurchaseOrderItem>(
    `SELECT ${ITEM_COLS} FROM purchase_order_items WHERE purchase_order_id = $1 ORDER BY sort_order ASC`,
    [purchaseOrderId]
  );
}

export async function createPurchaseOrder(
  tenantId: string,
  input: {
    orderType: PurchaseOrderType;
    supplierName: string;
    projectId?: string | null;
    title?: string | null;
    orderDate: string;
    memo?: string | null;
    createdBy?: string | null;
  }
): Promise<PurchaseOrder> {
  const id = generateId();
  const now = nowIso();
  const yyyymm = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const countRow = await queryOne<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM purchase_orders WHERE tenant_id = $1 AND order_no LIKE $2`,
    [tenantId, `PO-${yyyymm}-%`]
  );
  const orderNo = `PO-${yyyymm}-${String(Number(countRow?.cnt ?? 0) + 1).padStart(4, "0")}`;

  await query(
    `INSERT INTO purchase_orders (id, tenant_id, order_no, order_type, supplier_name, project_id, title,
      order_date, status, memo, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '下書き', $9, $10, $11, $12)`,
    [
      id,
      tenantId,
      orderNo,
      input.orderType,
      input.supplierName,
      input.projectId ?? null,
      input.title ?? null,
      input.orderDate,
      input.memo ?? null,
      input.createdBy ?? null,
      now,
      now,
    ]
  );
  return (await getPurchaseOrder(id))!;
}

export async function addPurchaseOrderItem(
  tenantId: string,
  purchaseOrderId: string,
  input: {
    itemCode?: string | null;
    itemName: string;
    specification?: string | null;
    quantity: number;
    unit?: string | null;
    memo?: string | null;
  }
): Promise<PurchaseOrderItem> {
  const id = generateId();
  const now = nowIso();
  const maxOrderRow = await queryOne<{ m: number }>(
    `SELECT COALESCE(MAX(sort_order), -1) as m FROM purchase_order_items WHERE purchase_order_id = $1`,
    [purchaseOrderId]
  );
  await query(
    `INSERT INTO purchase_order_items (id, tenant_id, purchase_order_id, item_code, item_name, specification,
      quantity, unit, memo, sort_order, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      id,
      tenantId,
      purchaseOrderId,
      input.itemCode ?? null,
      input.itemName,
      input.specification ?? null,
      input.quantity,
      input.unit ?? null,
      input.memo ?? null,
      Number(maxOrderRow?.m ?? -1) + 1,
      now,
      now,
    ]
  );
  return (await queryOne<PurchaseOrderItem>(`SELECT ${ITEM_COLS} FROM purchase_order_items WHERE id = $1`, [id]))!;
}

export async function deletePurchaseOrderItem(id: string): Promise<void> {
  await query(`DELETE FROM purchase_order_items WHERE id = $1`, [id]);
}

export async function setPurchaseOrderStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
  const now = nowIso();
  await query(`UPDATE purchase_orders SET status = $1, updated_at = $2 WHERE id = $3`, [status, now, id]);
  return (await getPurchaseOrder(id))!;
}
