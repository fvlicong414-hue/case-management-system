import * as XLSX from "xlsx";

export interface ParsedItem {
  itemCode: string;
  name: string;
  prices: { tierName: string; salesPrice: number }[];
}

function cellValue(sheet: XLSX.WorkSheet, addr: string): string | number | undefined {
  const cell = sheet[addr];
  if (!cell) return undefined;
  return cell.v;
}
function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * 標準見積書フォーマット(「修理」等のシート)の右側に埋め込まれた
 * 品目コード・品名・得意先別単価の一覧表を読み取る。
 * 単価が入っている行だけを対象にすることで、単価なしの重複リストは自動的に無視される。
 *   ブロック1: K=品目コード, M=品名, O=単価(A), P=単価(H)
 *   ブロック2: Q=品目コード, S=品名, U=単価(A), V=単価(M), W=単価(H)
 */
export function parseItemPriceTable(buffer: Buffer, sheetName?: string): ParsedItem[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const targetSheetName = sheetName ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) throw new Error(`シート「${targetSheetName}」が見つかりません`);

  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
  const items = new Map<string, ParsedItem>();

  for (let r = range.s.r; r <= range.e.r; r++) {
    const rowNum = r + 1;

    const code1 = cellValue(sheet, `K${rowNum}`);
    const name1 = cellValue(sheet, `M${rowNum}`);
    const priceA1 = cellValue(sheet, `O${rowNum}`);
    const priceH1 = cellValue(sheet, `P${rowNum}`);
    if (isNonEmptyString(code1) && isNonEmptyString(name1) && (isNumber(priceA1) || isNumber(priceH1))) {
      const prices: { tierName: string; salesPrice: number }[] = [];
      if (isNumber(priceA1)) prices.push({ tierName: "A", salesPrice: priceA1 });
      if (isNumber(priceH1)) prices.push({ tierName: "H", salesPrice: priceH1 });
      addOrMergeItem(items, normalizeCode(code1), name1.trim(), prices);
    }

    const code2 = cellValue(sheet, `Q${rowNum}`);
    const name2 = cellValue(sheet, `S${rowNum}`);
    const priceA2 = cellValue(sheet, `U${rowNum}`);
    const priceM2 = cellValue(sheet, `V${rowNum}`);
    const priceH2 = cellValue(sheet, `W${rowNum}`);
    if (
      isNonEmptyString(code2) &&
      isNonEmptyString(name2) &&
      (isNumber(priceA2) || isNumber(priceM2) || isNumber(priceH2))
    ) {
      const prices: { tierName: string; salesPrice: number }[] = [];
      if (isNumber(priceA2)) prices.push({ tierName: "A", salesPrice: priceA2 });
      if (isNumber(priceM2)) prices.push({ tierName: "M", salesPrice: priceM2 });
      if (isNumber(priceH2)) prices.push({ tierName: "H", salesPrice: priceH2 });
      addOrMergeItem(items, normalizeCode(code2), name2.trim(), prices);
    }
  }
  return Array.from(items.values());
}

function normalizeCode(code: string): string {
  return code.replace(/[\u3000\s]+/g, "").trim();
}
function addOrMergeItem(
  items: Map<string, ParsedItem>,
  itemCode: string,
  name: string,
  prices: { tierName: string; salesPrice: number }[]
) {
  const existing = items.get(itemCode);
  if (existing) {
    for (const pr of prices) {
      const idx = existing.prices.findIndex((x) => x.tierName === pr.tierName);
      if (idx >= 0) existing.prices[idx] = pr;
      else existing.prices.push(pr);
    }
  } else {
    items.set(itemCode, { itemCode, name, prices });
  }
}

export function listSheetNames(buffer: Buffer): string[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return workbook.SheetNames;
}
