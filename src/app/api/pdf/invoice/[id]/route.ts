import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getInvoice, listInvoiceItems } from "@/lib/db/invoices";
import { getCustomer } from "@/lib/db/customers";
import { getSettings } from "@/lib/db/settings";
import { getProject } from "@/lib/db/projects";
import { requireSession } from "@/lib/auth";
import { createDocumentLog } from "@/lib/db/documentLogs";
import { InvoicePdfDocument } from "@/lib/pdf/InvoicePdf";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) return NextResponse.json({ error: "請求書が見つかりません" }, { status: 404 });
  const customer = await getCustomer(invoice.customerId);
  const items = await listInvoiceItems(id);
  const settings = await getSettings(invoice.tenantId);

  const projectIds = Array.from(new Set(items.map((i) => i.projectId)));
  const projects = await Promise.all(projectIds.map((pid) => getProject(pid)));
  const completedDateByProjectId = new Map(projects.map((p) => [p?.id, p?.completedDate ?? null]));

  const buffer = await renderToBuffer(
    InvoicePdfDocument({
      invoiceNo: invoice.invoiceNo,
      invoiceDate: invoice.invoiceDate?.slice(0, 10),
      paymentDueDate: invoice.paymentDueDate?.slice(0, 10),
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
      bankInfo: settings.bankInfo,
      company: {
        name: settings.companyName,
        address: settings.companyAddress,
        phone: settings.companyPhone,
        invoiceRegistrationNumber: settings.companyInvoiceRegistrationNumber,
      },
    })
  );

  const fileName = `${invoice.invoiceNo}_請求書.pdf`;
  await createDocumentLog({
    tenantId: invoice.tenantId,
    documentType: "請求書",
    targetId: invoice.id,
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
