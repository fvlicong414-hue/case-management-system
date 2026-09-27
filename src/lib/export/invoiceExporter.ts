import * as XLSX from "xlsx";

export interface InvoiceExcelItem {
  siteName: string | null;
  billingType: string;
  amount: number;
}

export interface InvoiceExcelInput {
  invoiceNo: string;
  invoiceDate?: string | null;
  paymentDueDate?: string | null;
  customerName: string;
  billingName?: string | null;
  address?: string | null;
  items: InvoiceExcelItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  bankInfo?: string | null;
  company: {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    invoiceRegistrationNumber?: string | null;
  };
}

/**
 * 請求書をExcelファイルとして出力する。
 * PDF出力と違い、決まったテンプレートファイルを読み込むのではなく、
 * この関数の中でシートを組み立てる方式にしている。ファイルの読み込みに
 * 依存しないため、本番環境(Vercel)でファイルが見つからない、という
 * 種類の不具合が起こり得ない(PDF出力で発生したのと同種の問題を、
 * 構造的に避けている)。
 */
export function buildInvoiceExcel(input: InvoiceExcelInput): Buffer {
  const rows: (string | number | null)[][] = [];

  rows.push(["請求書"]);
  rows.push([]);
  rows.push([`${input.billingName ?? input.customerName} 御中`]);
  rows.push([]);
  rows.push(["請求書番号", input.invoiceNo]);
  rows.push(["請求日", input.invoiceDate ?? ""]);
  rows.push(["お支払期限", input.paymentDueDate ?? ""]);
  rows.push([]);
  rows.push(["現場名", "区分", "金額"]);

  const itemStartRow = rows.length; // 0-indexed。この後のitems行の開始位置
  for (const item of input.items) {
    rows.push([item.siteName ?? "", item.billingType, item.amount]);
  }

  rows.push([]);
  rows.push(["", "税抜合計", input.subtotal]);
  rows.push(["", "消費税", input.taxAmount]);
  rows.push(["", "税込合計", input.totalAmount]);
  rows.push([]);

  if (input.bankInfo) {
    rows.push(["お振込先"]);
    for (const line of input.bankInfo.split("\n")) rows.push([line]);
    rows.push([]);
  }

  rows.push([input.company.name ?? ""]);
  if (input.company.address) rows.push([input.company.address]);
  if (input.company.phone) rows.push([`TEL: ${input.company.phone}`]);
  if (input.company.invoiceRegistrationNumber) {
    rows.push([`登録番号: ${input.company.invoiceRegistrationNumber}`]);
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);

  // 金額の列(C列)に3桁区切りの表示形式を設定する
  const amountCol = 2; // C列(0始まり)
  for (let i = itemStartRow; i < itemStartRow + input.items.length; i++) {
    const addr = XLSX.utils.encode_cell({ r: i, c: amountCol });
    if (sheet[addr]) sheet[addr].z = "#,##0";
  }

  sheet["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "請求書");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer as Buffer;
}
