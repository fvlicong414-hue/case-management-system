import * as XLSX from "xlsx";

export interface ParsedInstructionSheet {
  customerName: string | null;
  customerContact: string | null;
  siteName: string | null;
  siteAddress: string | null;
}

function cellString(sheet: XLSX.WorkSheet, addr: string): string | null {
  const cell = sheet[addr];
  if (!cell || typeof cell.v !== "string") return null;
  const trimmed = cell.v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * 工事指示書シート(例:「指示書」「指示書1」)から、案件情報に転記したい項目を読み取る。
 * このフォーマットでの固定位置: 得意先名=A8, 担当者=C8, 詳しい工事名(現場名)=J8, 工事先住所=J10。
 * シートが存在しない場合はnullを返す(呼び出し側で「読み取れなかった」として扱う)。
 */
export function parseInstructionSheet(buffer: Buffer, sheetName: string): ParsedInstructionSheet | null {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return null;
  return {
    customerName: cellString(sheet, "A8"),
    customerContact: cellString(sheet, "C8"),
    siteName: cellString(sheet, "J8"),
    siteAddress: cellString(sheet, "J10"),
  };
}
