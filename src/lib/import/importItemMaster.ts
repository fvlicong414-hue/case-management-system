import { parseItemPriceTable } from "./itemMasterParser";
import { getItemMasterByCode, createItemMaster } from "../db/itemMaster";
import { upsertPriceTier } from "../db/itemPriceTiers";

export interface ImportSummary {
  totalParsed: number;
  created: number;
  updated: number;
  tiersWritten: number;
}

export async function importItemMasterFromExcel(
  tenantId: string,
  buffer: Buffer,
  sheetName?: string
): Promise<ImportSummary> {
  const parsed = parseItemPriceTable(buffer, sheetName);
  let created = 0;
  let updated = 0;
  let tiersWritten = 0;

  for (const item of parsed) {
    if (!item.itemCode) continue;
    const existing = await getItemMasterByCode(tenantId, item.itemCode);
    if (existing) {
      updated++;
    } else {
      const representative = item.prices.find((p) => p.tierName === "A") ?? item.prices[0];
      await createItemMaster(tenantId, {
        itemCode: item.itemCode,
        name: item.name,
        specification: null,
        unit: null,
        defaultSalesPrice: representative?.salesPrice ?? 0,
        defaultCostPrice: 0,
        category: null,
      });
      created++;
    }
    const itemMaster = existing ?? (await getItemMasterByCode(tenantId, item.itemCode));
    if (!itemMaster) continue;
    for (const price of item.prices) {
      await upsertPriceTier(tenantId, itemMaster.id, price.tierName, price.salesPrice);
      tiersWritten++;
    }
  }
  return { totalParsed: parsed.length, created, updated, tiersWritten };
}
