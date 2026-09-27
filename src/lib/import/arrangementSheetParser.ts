import * as XLSX from "xlsx";

export interface ParsedArrangementItem {
  itemCode: string;
  itemName: string | null;
}

const ROW_START = 13;
const ROW_END = 32;

function cellString(sheet: XLSX.WorkSheet, addr: string): string | null {
  const cell = sheet[addr];
  if (!cell || typeof cell.v !== "string") return null;
  const trimmed = cell.v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * 手配書(拾出表)シート(例:「手配書」「手配書1」)から、品番(B列)・品名(C列)だけを読み取る。
 * このシートの単価欄(K列・L列)はメーカー価格表とのVLOOKUPで、実際のファイルで
 * しばしば#N/A(参照エラー)になっているため、意図的に読み取らない。
 * シートが存在しない場合は空配列を返す。
 */
export function parseArrangementSheet(buffer: Buffer, sheetName: string): ParsedArrangementItem[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const items: ParsedArrangementItem[] = [];
  for (let row = ROW_START; row <= ROW_END; row++) {
    const itemCode = cellString(sheet, `B${row}`);
    if (!itemCode) continue;
    items.push({ itemCode, itemName: cellString(sheet, `C${row}`) });
  }
  return items;
}
