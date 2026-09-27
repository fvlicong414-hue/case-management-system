import { NextRequest, NextResponse } from "next/server";
import { getInvoice, listInvoiceItems } from "@/lib/db/invoices";
import { getCustomer } from "@/lib/db/customers";
import { getSettings } from "@/lib/db/settings";
import { getProject } from "@/lib/db/projects";
import { requireSession } from "@/lib/auth";
import { createDocumentLog } from "@/lib/db/documentLogs";
import { buildInvoiceExcel } from "@/lib/export/invoiceExporter";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) return NextResponse.json({ error: "請求書が見つかりません" }, { status: 404 });
  const customer = await getCustomer(invoice.customerId);
  const items = await listInvoiceItems(id);
  const settings = await getSettings(invoice.tenantId);

  // 明細の「納品月日」欄には、それぞれの案件の完了日を使う(分かる場合のみ)
  const projectIds = Array.from(new Set(items.map((i) => i.projectId)));
  const projects = await Promise.all(projectIds.map((pid) => getProject(pid)));
  const completedDateByProjectId = new Map(projects.map((p) => [p?.id, p?.completedDate ?? null]));

  const buffer = buildInvoiceExcel({
    invoiceDate: invoice.invoiceDate?.slice(0, 10),
    customerName: customer?.name ?? "",
    billingName: customer?.billingName,
    postalCode: customer?.postalCode,
    address: customer?.address,
    items: items.map((i) => ({
      siteName: i.siteName,
      billingType: i.billingType,
      amount: i.amount,
      completedDate: completedDateByProjectId.get(i.projectId) ?? null,
    })),
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    company: {
      name: settings.companyName,
      postalCode: settings.companyPostalCode,
      address: settings.companyAddress,
      phone: settings.companyPhone,
      invoiceRegistrationNumber: settings.companyInvoiceRegistrationNumber,
    },
  });

  const fileName = `${invoice.invoiceNo}_請求書.xlsx`;
  await createDocumentLog({
    tenantId: invoice.tenantId,
    documentType: "請求書(Excel)",
    targetId: invoice.id,
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
