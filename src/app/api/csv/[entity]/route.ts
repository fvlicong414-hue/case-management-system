import { NextRequest, NextResponse } from "next/server";
import { requireSession, can } from "@/lib/auth";
import { toCsv, csvResponse } from "@/lib/csv";
import { listCustomers } from "@/lib/db/customers";
import { listProjects } from "@/lib/db/projects";
import { listItemMasters } from "@/lib/db/itemMaster";
import { listEstimates } from "@/lib/db/estimates";
import { query } from "@/lib/db/client";
import { listBillingSchedules } from "@/lib/db/billingSchedules";
import { listInvoices } from "@/lib/db/invoices";
import { listDocumentLogs } from "@/lib/db/documentLogs";
import { listPurchaseOrders } from "@/lib/db/purchaseOrders";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const session = await requireSession();
  if (!can(session, "exportCsv")) {
    return NextResponse.json({ error: "CSVエクスポートの権限がありません" }, { status: 403 });
  }
  const { entity } = await params;
  const tenantId = session.tenantId;

  switch (entity) {
    case "customers": {
      const rows = await listCustomers(tenantId, { includeInactive: true });
      const csv = toCsv(
        [
          { key: "customerCode", label: "顧客コード" },
          { key: "name", label: "顧客名" },
          { key: "billingName", label: "請求先名" },
          { key: "address", label: "住所" },
          { key: "phone", label: "電話番号" },
          { key: "contactPerson", label: "担当者" },
          { key: "closingDay", label: "締日" },
          { key: "paymentTerms", label: "支払条件" },
          { key: "isActive", label: "有効" },
        ],
        rows
      );
      return csvResponse(csv, "customers.csv");
    }
    case "projects": {
      const rows = await listProjects(tenantId);
      const csv = toCsv(
        [
          { key: "projectCode", label: "案件番号" },
          { key: "projectName", label: "案件名" },
          { key: "siteName", label: "現場名" },
          { key: "customerName", label: "顧客名" },
          { key: "workCategory", label: "工事区分" },
          { key: "status", label: "ステータス" },
          { key: "completionPlanDate", label: "完了予定日" },
        ],
        rows
      );
      return csvResponse(csv, "projects.csv");
    }
    case "item-master": {
      const rows = await listItemMasters(tenantId, { includeInactive: true });
      const csv = toCsv(
        [
          { key: "itemCode", label: "品目コード" },
          { key: "name", label: "品目名" },
          { key: "specification", label: "仕様" },
          { key: "unit", label: "単位" },
          { key: "defaultSalesPrice", label: "標準売上単価" },
          { key: "defaultCostPrice", label: "標準原価単価" },
          { key: "category", label: "カテゴリ" },
          { key: "isActive", label: "有効" },
        ],
        rows
      );
      return csvResponse(csv, "item_master.csv");
    }
    case "estimates": {
      const rows = await listEstimates(tenantId);
      const csv = toCsv(
        [
          { key: "estimateNo", label: "見積番号" },
          { key: "projectName", label: "案件名" },
          { key: "customerName", label: "顧客名" },
          { key: "estimateDate", label: "見積日" },
          { key: "status", label: "ステータス" },
          { key: "salesTotal", label: "売上合計" },
          { key: "costTotal", label: "原価合計" },
          { key: "grossProfit", label: "粗利" },
          { key: "grossProfitRate", label: "粗利率" },
          { key: "totalWithTax", label: "税込合計" },
        ],
        rows
      );
      return csvResponse(csv, "estimates.csv");
    }
    case "estimate-items": {
      const rows = await query(
        `SELECT ei.item_name as "itemName", ei.specification, ei.quantity, ei.unit,
          ei.sales_unit_price as "salesUnitPrice", ei.sales_amount as "salesAmount",
          ei.cost_unit_price as "costUnitPrice", ei.cost_amount as "costAmount",
          ei.gross_profit as "grossProfit", e.estimate_no as "estimateNo"
         FROM estimate_items ei JOIN estimates e ON e.id = ei.estimate_id
         WHERE ei.tenant_id = $1 ORDER BY e.estimate_no, ei.sort_order`,
        [tenantId]
      );
      const csv = toCsv(
        [
          { key: "estimateNo", label: "見積番号" },
          { key: "itemName", label: "品目名" },
          { key: "specification", label: "仕様" },
          { key: "quantity", label: "数量" },
          { key: "unit", label: "単位" },
          { key: "salesUnitPrice", label: "売上単価" },
          { key: "salesAmount", label: "売上金額" },
          { key: "costUnitPrice", label: "原価単価" },
          { key: "costAmount", label: "原価金額" },
          { key: "grossProfit", label: "粗利" },
        ],
        rows
      );
      return csvResponse(csv, "estimate_items.csv");
    }
    case "specifications": {
      const rows = await query(
        `SELECT s.id, e.estimate_no as "estimateNo", p.project_name as "projectName", s.status,
          s.construction_scope as "constructionScope", s.created_at as "createdAt"
         FROM specifications s
         LEFT JOIN estimates e ON e.id = s.estimate_id
         LEFT JOIN projects p ON p.id = s.project_id
         WHERE s.tenant_id = $1`,
        [tenantId]
      );
      const csv = toCsv(
        [
          { key: "estimateNo", label: "見積番号" },
          { key: "projectName", label: "案件名" },
          { key: "status", label: "ステータス" },
          { key: "constructionScope", label: "施工範囲" },
          { key: "createdAt", label: "作成日" },
        ],
        rows
      );
      return csvResponse(csv, "specifications.csv");
    }
    case "billing-schedules": {
      const rows = await listBillingSchedules(tenantId);
      const csv = toCsv(
        [
          { key: "billingMonth", label: "請求月" },
          { key: "customerName", label: "顧客名" },
          { key: "projectName", label: "案件名" },
          { key: "billingType", label: "請求区分" },
          { key: "scheduledAmount", label: "請求予定額" },
          { key: "costAllocated", label: "原価按分額" },
          { key: "grossProfit", label: "粗利" },
          { key: "status", label: "ステータス" },
        ],
        rows
      );
      return csvResponse(csv, "billing_schedules.csv");
    }
    case "invoices": {
      const rows = await listInvoices(tenantId);
      const csv = toCsv(
        [
          { key: "invoiceNo", label: "請求番号" },
          { key: "customerName", label: "顧客名" },
          { key: "billingMonth", label: "請求月" },
          { key: "invoiceDate", label: "請求日" },
          { key: "totalAmount", label: "税込合計" },
          { key: "grossProfit", label: "粗利" },
          { key: "status", label: "ステータス" },
          { key: "paidDate", label: "入金日" },
        ],
        rows
      );
      return csvResponse(csv, "invoices.csv");
    }
    case "invoice-items": {
      const rows = await query(
        `SELECT i.invoice_no as "invoiceNo", ii.site_name as "siteName", ii.billing_type as "billingType",
          ii.amount
         FROM invoice_items ii JOIN invoices i ON i.id = ii.invoice_id
         WHERE ii.tenant_id = $1 ORDER BY i.invoice_no, ii.sort_order`,
        [tenantId]
      );
      const csv = toCsv(
        [
          { key: "invoiceNo", label: "請求番号" },
          { key: "siteName", label: "現場名" },
          { key: "billingType", label: "請求区分" },
          { key: "amount", label: "金額" },
        ],
        rows
      );
      return csvResponse(csv, "invoice_items.csv");
    }
    case "item-price-tiers": {
      const rows = await query(
        `SELECT im.item_code as "itemCode", im.name as "itemName", ipt.tier_name as "tierName",
          ipt.sales_price as "salesPrice"
         FROM item_price_tiers ipt JOIN item_master im ON im.id = ipt.item_master_id
         WHERE ipt.tenant_id = $1 ORDER BY im.item_code, ipt.tier_name`,
        [tenantId]
      );
      const csv = toCsv(
        [
          { key: "itemCode", label: "品目コード" },
          { key: "itemName", label: "品目名" },
          { key: "tierName", label: "価格区分" },
          { key: "salesPrice", label: "単価" },
        ],
        rows
      );
      return csvResponse(csv, "item_price_tiers.csv");
    }
    case "purchase-orders": {
      const rows = await listPurchaseOrders(tenantId);
      const csv = toCsv(
        [
          { key: "orderNo", label: "番号" },
          { key: "orderType", label: "種別" },
          { key: "supplierName", label: "仕入先" },
          { key: "title", label: "件名" },
          { key: "projectName", label: "関連案件" },
          { key: "orderDate", label: "発注日" },
          { key: "status", label: "ステータス" },
        ],
        rows
      );
      return csvResponse(csv, "purchase_orders.csv");
    }
    case "purchase-order-items": {
      const rows = await query(
        `SELECT po.order_no as "orderNo", poi.item_code as "itemCode", poi.item_name as "itemName",
          poi.specification, poi.quantity, poi.unit, poi.memo
         FROM purchase_order_items poi JOIN purchase_orders po ON po.id = poi.purchase_order_id
         WHERE poi.tenant_id = $1 ORDER BY po.order_no, poi.sort_order`,
        [tenantId]
      );
      const csv = toCsv(
        [
          { key: "orderNo", label: "発注番号" },
          { key: "itemCode", label: "品番" },
          { key: "itemName", label: "品名" },
          { key: "specification", label: "仕様" },
          { key: "quantity", label: "数量" },
          { key: "unit", label: "単位" },
          { key: "memo", label: "備考" },
        ],
        rows
      );
      return csvResponse(csv, "purchase_order_items.csv");
    }
    case "document-logs": {
      const rows = await listDocumentLogs(tenantId);
      const csv = toCsv(
        [
          { key: "documentType", label: "帳票種別" },
          { key: "fileName", label: "ファイル名" },
          { key: "outputAt", label: "出力日時" },
          { key: "outputBy", label: "出力者" },
          { key: "status", label: "状態" },
        ],
        rows
      );
      return csvResponse(csv, "document_logs.csv");
    }
    default:
      return NextResponse.json({ error: "不明なエクスポート対象です" }, { status: 400 });
  }
}
