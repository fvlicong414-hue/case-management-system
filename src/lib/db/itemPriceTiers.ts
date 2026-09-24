import { query, queryOne, generateId, nowIso } from "./client";

export interface ItemPriceTier {
  id: string;
  tenantId: string;
  itemMasterId: string;
  tierName: string;
  salesPrice: number;
  createdAt: string;
  updatedAt: string;
}

const SELECT_COLS = `id, tenant_id as "tenantId", item_master_id as "itemMasterId", tier_name as "tierName",
  sales_price as "salesPrice", created_at as "createdAt", updated_at as "updatedAt"`;

export async function listPriceTiersByItem(itemMasterId: string): Promise<ItemPriceTier[]> {
  return query<ItemPriceTier>(
    `SELECT ${SELECT_COLS} FROM item_price_tiers WHERE item_master_id = $1 ORDER BY tier_name ASC`,
    [itemMasterId]
  );
}

export async function listPriceTiersByItems(itemMasterIds: string[]): Promise<ItemPriceTier[]> {
  if (itemMasterIds.length === 0) return [];
  return query<ItemPriceTier>(
    `SELECT ${SELECT_COLS} FROM item_price_tiers WHERE item_master_id = ANY($1) ORDER BY tier_name ASC`,
    [itemMasterIds]
  );
}

export async function upsertPriceTier(
  tenantId: string,
  itemMasterId: string,
  tierName: string,
  salesPrice: number
): Promise<ItemPriceTier> {
  const existing = await queryOne<ItemPriceTier>(
    `SELECT ${SELECT_COLS} FROM item_price_tiers WHERE item_master_id = $1 AND tier_name = $2`,
    [itemMasterId, tierName]
  );
  const now = nowIso();
  if (existing) {
    await query(`UPDATE item_price_tiers SET sales_price = $1, updated_at = $2 WHERE id = $3`, [
      salesPrice,
      now,
      existing.id,
    ]);
    return { ...existing, salesPrice };
  }
  const id = generateId();
  await query(
    `INSERT INTO item_price_tiers (id, tenant_id, item_master_id, tier_name, sales_price, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, tenantId, itemMasterId, tierName, salesPrice, now, now]
  );
  return { id, tenantId, itemMasterId, tierName, salesPrice, createdAt: now, updatedAt: now };
}

export async function deletePriceTier(id: string): Promise<void> {
  await query(`DELETE FROM item_price_tiers WHERE id = $1`, [id]);
}
