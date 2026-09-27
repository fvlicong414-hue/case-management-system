import * as XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";

const TEMPLATE_PATH = path.join(process.cwd(), "src/lib/export/templates/invoice_template.xlsx");
const SHEET_NAME = "月末";

export interface InvoiceExcelItem {
  siteName: string | null;
  billingType: string;
  amount: number;
  /** その項目に紐づく案件の完了日(分かる場合のみ。「納品月日」欄に使う) */
  completedDate?: string | null;
}

export interface InvoiceExcelInput {
  invoiceDate?: string | null;
  customerName: string;
  billingName?: string | null;
  postalCode?: string | null;
  address?: string | null;
  items: InvoiceExcelItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  company: {
    name?: string | null;
    postalCode?: string | null;
    address?: string | null;
    phone?: string | null;
    invoiceRegistrationNumber?: string | null;
  };
}

function setCell(sheet: XLSX.WorkSheet, addr: string, value: string | number) {
  const existing = sheet[addr];
  const cell: XLSX.CellObject = typeof value === "number" ? { t: "n", v: value } : { t: "s", v: value };
  // 元のセルに書式(色・罫線などのスタイル、%表示などの表示形式)が設定されていた場合は、
  // 値だけ差し替えて書式は維持する(そのまま上書きすると書式が失われてしまうため)。
  if (existing?.s) cell.s = existing.s;
  if (existing?.z) cell.z = existing.z;
  sheet[addr] = cell;
}

/** 西暦の日付文字列(YYYY-MM-DD)を、令和の年・月・日に変換する(令和1年=2019年)。 */
function toReiwa(dateStr: string): { year: number; month: number; day: number } {
  const d = new Date(dateStr);
  return { year: d.getFullYear() - 2018, month: d.getMonth() + 1, day: d.getDate() };
}

function formatDeliveryDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const { year, month, day } = toReiwa(dateStr);
  return `R${year}.${month}.${day}`;
}

const ITEM_START_ROW = 20;
const ITEM_MAX_ROWS = 18; // テンプレートの明細欄(20〜37行目)に収まる件数
const TAX_RATE = 0.1;

/**
 * 請求書を、中部システム工業株式会社指定のExcelフォーマット(テンプレート)に
 * 反映して出力する。テンプレートの見た目(罫線・書式)を保つため、値を書き込む
 * セルだけをピンポイントで置き換える(発注書Excel出力と同じ仕組み)。
 *
 * 「先月残高」「当月入金額」「繰越残高」は、月をまたいだ入出金を追跡する仕組みが
 * このシステムにまだ無いため、今回は空欄のままにしている(手入力を想定)。
 * また、明細の「御担当者」欄(現場担当の社員名)も、対応するデータが現時点で
 * ないため空欄のままにしている。
 */
export function buildInvoiceExcel(input: InvoiceExcelInput): Buffer {
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH);
  const workbook = XLSX.read(templateBuffer, { type: "buffer", cellStyles: true });
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) throw new Error(`請求書テンプレートにシート「${SHEET_NAME}」が見つかりません`);

  // 発行日(令和表記)
  if (input.invoiceDate) {
    const { year, month, day } = toReiwa(input.invoiceDate);
    setCell(sheet, "AO5", year);
    setCell(sheet, "AW5", month);
    setCell(sheet, "AY5", day);
  }

  // 自社情報(登録番号・会社名・郵便番号・住所・電話)
  // テンプレートの元の構造(AL8=郵便番号だけの短い行、AL9=住所の行)に合わせて書き込む。
  // 以前はAL8に住所までまとめて書き込んでいたため、その行の幅に収まらず文字が
  // 見切れてしまっていた。
  if (input.company.invoiceRegistrationNumber) setCell(sheet, "AL6", input.company.invoiceRegistrationNumber);
  if (input.company.name) setCell(sheet, "AL7", input.company.name);
  if (input.company.postalCode) setCell(sheet, "AL8", `〒${input.company.postalCode}`);
  if (input.company.address) {
    setCell(sheet, "AL9", input.company.address);
    setCell(sheet, "AL10", "");
  }
  if (input.company.phone) setCell(sheet, "AL11", `ＴＥＬ　${input.company.phone}`);

  // 得意先情報
  setCell(sheet, "I4", `〒${input.postalCode ?? ""}`);
  if (input.address) setCell(sheet, "I6", input.address);
  setCell(sheet, "I8", `${input.billingName ?? input.customerName}　御中`);

  // 明細(テンプレートの20〜37行目、最大18件)
  input.items.slice(0, ITEM_MAX_ROWS).forEach((item, idx) => {
    const row = ITEM_START_ROW + idx;
    if (item.completedDate) setCell(sheet, `A${row}`, formatDeliveryDate(item.completedDate));
    if (item.siteName) setCell(sheet, `M${row}`, item.siteName);
    setCell(sheet, `AG${row}`, 1);
    setCell(sheet, `AK${row}`, "式");
    setCell(sheet, `AO${row}`, item.amount);
    const lineTax = Math.round(item.amount * TAX_RATE);
    setCell(sheet, `AU${row}`, lineTax);
    setCell(sheet, `BA${row}`, item.amount + lineTax);
  });

  // 当月ご請求金額・差引合計金額(繰越なしのため同額)、および下部の合計欄
  // (消費税率のセルはテンプレート側の「10%」表示のままにし、上書きしない)
  setCell(sheet, "AK17", input.totalAmount);
  setCell(sheet, "AV17", input.totalAmount);
  setCell(sheet, "AO40", input.subtotal);
  setCell(sheet, "AO41", input.taxAmount);
  setCell(sheet, "AO42", input.totalAmount);

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
