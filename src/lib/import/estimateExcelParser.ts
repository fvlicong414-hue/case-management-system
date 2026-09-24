import * as XLSX from "xlsx";

const ITEM_START_ROW = 21;
const ITEM_MAX_ROWS = 23;
const SPEC_ROWS = [46, 47];

export interface ParsedEstimateItem {
  itemName: string;
  quantity: number;
  unit?: string | null;
  salesUnitPrice: number;
}

export interface ParsedEstimate {
  title?: string | null;
  memo?: string | null;
  items: ParsedEstimateItem[];
}

function cellValue(sheet: XLSX.WorkSheet, addr: string): string | number | undefined {
  const cell = sheet[addr];
  return cell ? cell.v : undefined;
}
function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * 標準見積書フォーマット(修理/新規と同形式)のExcelから、工事名・明細・仕様条件を読み取る。
 * 明細1行目に「工事内容+品目名」をまとめて入力する運用(例:「SL300外倒し窓一箇所修繕」)にも
 * そのまま対応する(品目名として1つの文字列で読み取るだけのため、特別な処理は不要)。
 */
export function parseStandardEstimateExcel(buffer: Buffer, sheetName?: string): ParsedEstimate {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const targetSheetName = sheetName ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) throw new Error(`シート「${targetSheetName}」が見つかりません`);

  const title = cellValue(sheet, "B12");
  const items: ParsedEstimateItem[] = [];
  for (let i = 0; i < ITEM_MAX_ROWS; i++) {
    const row = ITEM_START_ROW + i;
    const name = cellValue(sheet, `B${row}`);
    if (!isNonEmptyString(name)) continue;
    const quantity = cellValue(sheet, `F${row}`);
    const unit = cellValue(sheet, `G${row}`);
    const unitPrice = cellValue(sheet, `H${row}`);
    const amount = cellValue(sheet, `I${row}`);
    const qty = isNumber(quantity) ? quantity : 1;

    // 単価欄(H列)が入っていればそれを使う。単価欄が空でも、内訳書を別途使う運用の
    // 見積書では金額欄(I列)に合計金額だけが入っていることがあるため、その場合は
    // 金額÷数量で単価を逆算する(金額の再現性を優先し、四捨五入等の誤差は生じさせない)。
    let salesUnitPrice = 0;
    if (isNumber(unitPrice) && unitPrice > 0) {
      salesUnitPrice = unitPrice;
    } else if (isNumber(amount) && amount > 0 && qty > 0) {
      salesUnitPrice = amount / qty;
    }

    items.push({
      itemName: name.trim(),
      quantity: qty,
      unit: isNonEmptyString(unit) ? unit.trim() : null,
      salesUnitPrice,
    });
  }
  const memoLines = SPEC_ROWS.map((r) => cellValue(sheet, `A${r}`)).filter(isNonEmptyString);
  return {
    title: isNonEmptyString(title) ? title.trim() : null,
    memo: memoLines.length > 0 ? memoLines.join("\n") : null,
    items,
  };
}

export function listSheetNames(buffer: Buffer): string[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return workbook.SheetNames;
}
