import * as XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";
import { round2 } from "../calc";

const TEMPLATE_PATH = path.join(process.cwd(), "src/lib/export/templates/standard_estimate.xlsx");

const ESTIMATE_SHEET = "修　理";
const ITEM_START_ROW = 21;
const ITEM_MAX_ROWS = 23;
const TOTAL_ROW = 44;
const SPEC_ROWS = [46, 47];

const PROCUREMENT_SHEET = "手配書";
const PROCUREMENT_ITEM_START_ROW = 13;
const PROCUREMENT_MAX_ROWS = 30;

const INSTRUCTION_SHEET = "指示書";
const INSTRUCTION_ITEM_START_ROW = 17;
const INSTRUCTION_MAX_ROWS = 14;

export interface PackageItem {
  itemCode?: string | null;
  itemName: string;
  specification?: string | null;
  quantity: number;
  unit?: string | null;
  salesUnitPrice: number;
  salesAmount: number;
  memo?: string | null;
}

export interface EstimatePackageInput {
  customerName: string;
  billingName?: string | null;
  customerAddress?: string | null;
  customerContact?: string | null;
  title?: string | null;
  projectName: string;
  items: PackageItem[];
  memo?: string | null;
  constructionMethod?: string | null; // 仕様書の施工方法
  cautionNotes?: string | null; // 仕様書の注意事項
}

function setCell(sheet: XLSX.WorkSheet, addr: string, value: string | number) {
  if (typeof value === "number") sheet[addr] = { t: "n", v: value };
  else sheet[addr] = { t: "s", v: value };
}

/**
 * 見積書(修理シート)・手配書・工事指示書を、1つのExcelブックにまとめて出力する。
 * 従来3つの別ファイルに分かれていたものを統合し、シートを切り替えるだけで
 * 全て確認できるようにしている。
 */
export function exportEstimatePackage(input: EstimatePackageInput): { buffer: Buffer; truncated: boolean } {
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH);
  const workbook = XLSX.read(templateBuffer, { type: "buffer", cellStyles: true });

  // ---- 1. 見積書(修理シート) ----
  const estimateSheet = workbook.Sheets[ESTIMATE_SHEET];
  if (!estimateSheet) throw new Error(`テンプレートにシート「${ESTIMATE_SHEET}」が見つかりません`);

  setCell(estimateSheet, "A8", input.billingName || input.customerName);
  setCell(estimateSheet, "B12", input.title || input.projectName);

  const truncated = input.items.length > ITEM_MAX_ROWS;
  const itemsToWrite = input.items.slice(0, ITEM_MAX_ROWS);
  itemsToWrite.forEach((item, idx) => {
    const row = ITEM_START_ROW + idx;
    setCell(estimateSheet, `A${row}`, idx + 1);
    const nameWithSpec = item.specification ? `${item.itemName}(${item.specification})` : item.itemName;
    setCell(estimateSheet, `B${row}`, nameWithSpec);
    setCell(estimateSheet, `F${row}`, item.quantity);
    if (item.unit) setCell(estimateSheet, `G${row}`, item.unit);
    setCell(estimateSheet, `H${row}`, item.salesUnitPrice);
    setCell(estimateSheet, `I${row}`, round2(item.salesAmount));
    if (item.memo) setCell(estimateSheet, `J${row}`, item.memo);
  });
  const total = round2(itemsToWrite.reduce((s, i) => s + i.salesAmount, 0));
  setCell(estimateSheet, `I${TOTAL_ROW}`, total);
  if (input.memo) {
    const lines = input.memo.split(/\r?\n/).filter((l) => l.length > 0);
    SPEC_ROWS.forEach((row, idx) => {
      if (lines[idx]) setCell(estimateSheet, `A${row}`, lines[idx]);
    });
  }

  // ---- 2. 手配書 ----
  const procurementSheet = workbook.Sheets[PROCUREMENT_SHEET];
  if (procurementSheet) {
    setCell(procurementSheet, "A6", input.customerName);
    setCell(procurementSheet, "B10", input.projectName);
    input.items.slice(0, PROCUREMENT_MAX_ROWS).forEach((item, idx) => {
      const row = PROCUREMENT_ITEM_START_ROW + idx;
      if (item.itemCode) setCell(procurementSheet, `B${row}`, item.itemCode);
      setCell(procurementSheet, `C${row}`, item.itemName);
      setCell(procurementSheet, `J${row}`, item.quantity);
    });
  }

  // ---- 3. 工事指示書 ----
  const instructionSheet = workbook.Sheets[INSTRUCTION_SHEET];
  if (instructionSheet) {
    setCell(instructionSheet, "A7", input.customerName);
    setCell(instructionSheet, "J7", input.title || input.projectName);
    // 元請先住所・担当者の代わりに、案件の住所・担当者を得意先名の下に補足として反映
    if (input.customerAddress) setCell(instructionSheet, "J9", input.customerAddress);
    if (input.customerContact) setCell(instructionSheet, "C7", input.customerContact);

    let row = INSTRUCTION_ITEM_START_ROW;
    const noteLines: string[] = [];
    if (input.constructionMethod) noteLines.push(`施工方法: ${input.constructionMethod}`);
    if (input.cautionNotes) noteLines.push(`注意事項: ${input.cautionNotes}`);
    for (const note of noteLines) {
      setCell(instructionSheet, `L${row}`, note);
      row++;
    }
    const remainingRows = Math.max(0, INSTRUCTION_MAX_ROWS - noteLines.length);
    input.items.slice(0, remainingRows).forEach((item) => {
      setCell(instructionSheet, `L${row}`, item.itemName);
      setCell(instructionSheet, `N${row}`, item.quantity); // 見積数
      setCell(instructionSheet, `O${row}`, item.quantity); // 手配数(在庫を確認のうえ手動で調整してください)
      row++;
    });
  }

  const outBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return { buffer: outBuffer, truncated };
}
