import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSpecification } from "@/lib/db/specifications";
import { getEstimate } from "@/lib/db/estimates";
import { getProject } from "@/lib/db/projects";
import { getCustomer } from "@/lib/db/customers";
import { getSettings } from "@/lib/db/settings";
import { requireSession } from "@/lib/auth";
import { createDocumentLog } from "@/lib/db/documentLogs";
import { SpecificationPdfDocument } from "@/lib/pdf/SpecificationPdf";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const spec = await getSpecification(id);
  if (!spec) return NextResponse.json({ error: "仕様書が見つかりません" }, { status: 404 });
  const estimate = await getEstimate(spec.estimateId);
  const project = await getProject(spec.projectId);
  const customer = estimate ? await getCustomer(estimate.customerId) : undefined;
  const settings = await getSettings(spec.tenantId);

  const buffer = await renderToBuffer(
    SpecificationPdfDocument({
      estimateNo: estimate?.estimateNo ?? "",
      createdDate: spec.createdAt?.slice(0, 10),
      customerName: customer?.name ?? "",
      projectName: project?.projectName ?? "",
      siteName: project?.siteName,
      constructionScope: spec.constructionScope,
      materials: spec.materials,
      method: spec.method,
      notes: spec.notes,
      warranty: spec.warranty,
      company: { name: settings.companyName, address: settings.companyAddress, phone: settings.companyPhone },
    })
  );

  const fileName = `${estimate?.estimateNo ?? spec.id}_仕様書.pdf`;
  await createDocumentLog({
    tenantId: spec.tenantId,
    documentType: "仕様書",
    targetId: spec.id,
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
