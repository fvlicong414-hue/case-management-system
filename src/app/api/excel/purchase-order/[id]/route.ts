import { NextRequest, NextResponse } from "next/server";
import { getPurchaseOrder, listPurchaseOrderItems } from "@/lib/db/purchaseOrders";
import { requireSession } from "@/lib/auth";
import { createDocumentLog } from "@/lib/db/documentLogs";
import { exportPurchaseOrderToExcel } from "@/lib/export/purchaseOrderExporter";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const order = await getPurchaseOrder(id);
  if (!order) return NextResponse.json({ error: "発注書が見つかりません" }, { status: 404 });
  const items = await listPurchaseOrderItems(id);

  const buffer = exportPurchaseOrderToExcel(order.orderType, {
    supplierName: order.supplierName,
    title: order.title,
    items: items.map((i) => ({ itemCode: i.itemCode, itemName: i.itemName, quantity: i.quantity, unit: i.unit, memo: i.memo })),
  });

  const fileName = `${order.orderNo}_${order.orderType}.xlsx`;
  await createDocumentLog({
    tenantId: order.tenantId,
    documentType: "手配書・指示書",
    targetId: order.id,
    fileName,
    outputBy: session.name,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}
