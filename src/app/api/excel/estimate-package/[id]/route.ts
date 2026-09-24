import { NextRequest, NextResponse } from "next/server";
import { getEstimate, listEstimateItems } from "@/lib/db/estimates";
import { getProject } from "@/lib/db/projects";
import { getCustomer } from "@/lib/db/customers";
import { getSpecificationByEstimate } from "@/lib/db/specifications";
import { requireSession } from "@/lib/auth";
import { createDocumentLog } from "@/lib/db/documentLogs";
import { exportEstimatePackage } from "@/lib/export/estimatePackageExporter";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const estimate = await getEstimate(id);
  if (!estimate) return NextResponse.json({ error: "見積が見つかりません" }, { status: 404 });
  const project = await getProject(estimate.projectId);
  const customer = await getCustomer(estimate.customerId);
  const specification = await getSpecificationByEstimate(id);
  const items = await listEstimateItems(id);

  const { buffer, truncated } = exportEstimatePackage({
    customerName: customer?.name ?? "",
    billingName: customer?.billingName,
    customerAddress: project?.siteAddress ?? customer?.address,
    customerContact: project?.customerContact ?? customer?.contactPerson,
    title: estimate.title,
    projectName: project?.projectName ?? "",
    items: items.map((i) => ({
      itemName: i.itemName,
      specification: i.specification,
      quantity: i.quantity,
      unit: i.unit,
      salesUnitPrice: i.salesUnitPrice,
      salesAmount: i.salesAmount,
      memo: i.memo,
    })),
    memo: estimate.memo,
    constructionMethod: specification?.method,
    cautionNotes: specification?.notes,
  });

  const fileName = `${estimate.estimateNo}_見積書_手配書_指示書.xlsx`;
  await createDocumentLog({
    tenantId: estimate.tenantId,
    documentType: "手配書・指示書",
    targetId: estimate.id,
    fileName,
    outputBy: session.name,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      "X-Truncated": truncated ? "true" : "false",
    },
  });
}
