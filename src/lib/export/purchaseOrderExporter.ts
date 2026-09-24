import * as XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";

const TEMPLATE_PATH = path.join(process.cwd(), "src/lib/export/templates/standard_estimate.xlsx");

export interface OrderExcelItem {
  itemCode?: string | null;
  itemName: string;
  quantity: number;
  unit?: string | null;
  memo?: string | null;
}
export interface OrderExcelInput {
  supplierName: string;
  title?: string | null;
  items: OrderExcelItem[];
}
interface TemplateConfig {
  sheetName: string;
  supplierCell: string;
  titleCell?: string;
  itemStartRow: number;
  itemRowStep: number;
  maxRows: number;
  cols: { itemCode?: string; itemName: string; quantity: string; unit?: string; memo?: string };
}

const ORDER_TEMPLATE: TemplateConfig = {
  sheetName: "豊和発注書",
  supplierCell: "B7",
  titleCell: "D15",
  itemStartRow: 18,
  itemRowStep: 1,
  maxRows: 17,
  cols: { itemCode: "A", itemName: "D", quantity: "H", unit: "I", memo: "L" },
};
const QUOTE_REQUEST_TEMPLATE: TemplateConfig = {
  sheetName: "アイメイ",
  supplierCell: "A12",
  itemStartRow: 35,
  itemRowStep: 2,
  maxRows: 19,
  cols: { itemName: "G", quantity: "O", memo: "Q" },
};

function setCell(sheet: XLSX.WorkSheet, addr: string, value: string | number) {
  if (typeof value === "number") sheet[addr] = { t: "n", v: value };
  else sheet[addr] = { t: "s", v: value };
}

function fillTemplate(config: TemplateConfig, input: OrderExcelInput): Buffer {
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH);
  const workbook = XLSX.read(templateBuffer, { type: "buffer", cellStyles: true });
  const sheet = workbook.Sheets[config.sheetName];
  if (!sheet) throw new Error(`テンプレートにシート「${config.sheetName}」が見つかりません`);

  setCell(sheet, config.supplierCell, input.supplierName);
  if (config.titleCell && input.title) setCell(sheet, config.titleCell, input.title);

  input.items.slice(0, config.maxRows).forEach((item, idx) => {
    const row = config.itemStartRow + idx * config.itemRowStep;
    if (config.cols.itemCode && item.itemCode) setCell(sheet, `${config.cols.itemCode}${row}`, item.itemCode);
    setCell(sheet, `${config.cols.itemName}${row}`, item.itemName);
    setCell(sheet, `${config.cols.quantity}${row}`, item.quantity);
    if (config.cols.unit && item.unit) setCell(sheet, `${config.cols.unit}${row}`, item.unit);
    if (config.cols.memo && item.memo) setCell(sheet, `${config.cols.memo}${row}`, item.memo);
  });

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function exportPurchaseOrderToExcel(orderType: "発注書" | "見積依頼書", input: OrderExcelInput): Buffer {
  const config = orderType === "見積依頼書" ? QUOTE_REQUEST_TEMPLATE : ORDER_TEMPLATE;
  return fillTemplate(config, input);
}
