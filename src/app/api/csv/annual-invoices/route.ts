import { NextRequest, NextResponse } from "next/server";
import { requireSession, can } from "@/lib/auth";
import { listAnnualInvoices } from "@/lib/db/reports";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!can(session, "exportCsv")) {
    return NextResponse.json({ error: "CSVエクスポートの権限がありません" }, { status: 403 });
  }
  const year = Number(req.nextUrl.searchParams.get("year")) || new Date().getFullYear();
  const rows = await listAnnualInvoices(session.tenantId, year);
  const csv = toCsv(
    [
      { key: "invoiceNo", label: "請求番号" },
      { key: "customerName", label: "得意先名" },
      { key: "billingMonth", label: "請求月" },
      { key: "invoiceDate", label: "請求日" },
      { key: "subtotal", label: "税抜合計" },
      { key: "taxAmount", label: "消費税" },
      { key: "totalAmount", label: "税込合計" },
      { key: "grossProfit", label: "粗利" },
      { key: "status", label: "ステータス" },
      { key: "paidDate", label: "入金日" },
    ],
    rows
  );
  return csvResponse(csv, `annual_invoices_${year}.csv`);
}
