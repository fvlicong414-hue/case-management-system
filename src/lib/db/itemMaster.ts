import { query, queryOne, generateId, nowIso } from "./client";
import type { ItemMaster } from "./types";

const SELECT_COLS = `id, tenant_id as "tenantId", item_code as "itemCode", name, specification, unit,
  default_sales_price as "defaultSalesPrice", default_cost_price as "defaultCostPrice", category,
  is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`;

export interface ItemSearch {
  name?: string;
  itemCode?: string;
  category?: string;
  unit?: string;
  includeInactive?: boolean;
}

export async function listItemMasters(tenantId: string, search: ItemSearch = {}): Promise<ItemMaster[]> {
  const clauses = ["tenant_id = $1"];
  const params: any[] = [tenantId];
  let i = 2;
  if (search.name) {
    clauses.push(`name ILIKE $${i++}`);
    params.push(`%${search.name}%`);
  }
  if (search.itemCode) {
    clauses.push(`item_code ILIKE $${i++}`);
    params.push(`%${search.itemCode}%`);
  }
  if (search.category) {
    clauses.push(`category ILIKE $${i++}`);
    params.push(`%${search.category}%`);
  }
  if (search.unit) {
    clauses.push(`unit = $${i++}`);
    params.push(search.unit);
  }
  if (!search.includeInactive) {
    clauses.push("is_active = true");
  }
  const sql = `SELECT ${SELECT_COLS} FROM item_master WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC`;
  return query<ItemMaster>(sql, params);
}

export async function getItemMaster(id: string): Promise<ItemMaster | undefined> {
  return queryOne<ItemMaster>(`SELECT ${SELECT_COLS} FROM item_master WHERE id = $1`, [id]);
}

export async function createItemMaster(
  tenantId: string,
  input: Omit<ItemMaster, "id" | "tenantId" | "isActive" | "createdAt" | "updatedAt">
): Promise<ItemMaster> {
  const id = generateId();
  const now = nowIso();
  await query(
    `INSERT INTO item_master (id, tenant_id, item_code, name, specification, unit, default_sales_price,
      default_cost_price, category, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11)`,
    [
      id,
      tenantId,
      input.itemCode,
      input.name,
      input.specification,
      input.unit,
      input.defaultSalesPrice,
      input.defaultCostPrice,
      input.category,
      now,
      now,
    ]
  );
  return (await getItemMaster(id))!;
}

export async function updateItemMaster(id: string, input: Partial<ItemMaster>): Promise<ItemMaster> {
  const current = await getItemMaster(id);
  if (!current) throw new Error("品目が見つかりません");
  const merged = { ...current, ...input };
  const now = nowIso();
  await query(
    `UPDATE item_master SET item_code = $1, name = $2, specification = $3, unit = $4,
      default_sales_price = $5, default_cost_price = $6, category = $7, is_active = $8, updated_at = $9
      WHERE id = $10`,
    [
      merged.itemCode,
      merged.name,
      merged.specification,
      merged.unit,
      merged.defaultSalesPrice,
      merged.defaultCostPrice,
      merged.category,
      merged.isActive,
      now,
      id,
    ]
  );
  return (await getItemMaster(id))!;
}
