import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getEstimate, listEstimateItems } from "@/lib/db/estimates";
import { getProject } from "@/lib/db/projects";
import { getCustomer } from "@/lib/db/customers";
import { getSettings } from "@/lib/db/settings";
import { requireSession } from "@/lib/auth";
import { createDocumentLog } from "@/lib/db/documentLogs";
import { EstimatePdfDocument } from "@/lib/pdf/EstimatePdf";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const estimate = await getEstimate(id);
  if (!estimate) return NextResponse.json({ error: "見積が見つかりません" }, { status: 404 });
  const project = await getProject(estimate.projectId);
  const customer = await getCustomer(estimate.customerId);
  const items = await listEstimateItems(id);
  const settings = await getSettings(estimate.tenantId);

  const buffer = await renderToBuffer(
    EstimatePdfDocument({
      estimateNo: estimate.estimateNo,
      estimateDate: estimate.estimateDate?.slice(0, 10),
      customerName: customer?.name ?? "",
      billingName: customer?.billingName,
      projectName: project?.projectName ?? "",
      siteName: project?.siteName,
      title: estimate.title,
      items: items.map((i) => ({
        itemName: i.itemName,
        specification: i.specification,
        quantity: i.quantity,
        unit: i.unit,
        salesUnitPrice: i.salesUnitPrice,
        salesAmount: i.salesAmount,
      })),
      salesTotal: estimate.salesTotal,
      taxAmount: estimate.taxAmount,
      totalWithTax: estimate.totalWithTax,
      memo: estimate.memo,
      company: {
        name: settings.companyName,
        address: settings.companyAddress,
        phone: settings.companyPhone,
        invoiceRegistrationNumber: settings.companyInvoiceRegistrationNumber,
      },
    })
  );

  const fileName = `${estimate.estimateNo}_見積書.pdf`;
  await createDocumentLog({
    tenantId: estimate.tenantId,
    documentType: "見積書",
    targetId: estimate.id,
    fileName,
    outputBy: session.name,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}
