import { getInvoice, listInvoiceItems } from "@/lib/db/invoices";
import { getCustomer } from "@/lib/db/customers";
import { requireSession, can } from "@/lib/auth";
import { formatCurrency } from "@/lib/calc";
import { markInvoiceSentAction, markInvoicePaidAction, cancelInvoiceAction, reissueInvoiceAction } from "@/lib/actions/invoices";
import { Card, CardHeader, Input, Button, PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { AlertBanner } from "@/components/ui/alert";
import { notFound } from "next/navigation";
import { listDocumentLogs } from "@/lib/db/documentLogs";

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, success } = await searchParams;
  const session = await requireSession();
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  const customer = await getCustomer(invoice.customerId);
  const items = await listInvoiceItems(id);
  const allLogs = await listDocumentLogs(invoice.tenantId, { documentType: "請求書" });
  const logs = allLogs.filter((l) => l.targetId === id);
  const canCancel = can(session, "cancelReissue");

  return (
    <div>
      <PageHeader
        title={`請求書 ${invoice.invoiceNo}`}
        subtitle={`顧客: ${customer?.name ?? "-"} / 請求月: ${invoice.billingMonth}`}
        actions={<StatusBadge status={invoice.status} />}
      />
      <AlertBanner error={error} success={success} />

      <Card className="mb-5">
        <CardHeader title="操作" />
        <div className="flex flex-wrap items-center gap-2 p-4">
          <a href={`/api/pdf/invoice/${id}`} target="_blank" rel="noreferrer">
            <Button type="button" variant="secondary" size="sm">
              請求書PDF再出力
            </Button>
          </a>
          {invoice.status === "発行済" && (
            <form action={markInvoiceSentAction.bind(null, id)}>
              <Button type="submit" size="sm">
                送付済にする
              </Button>
            </form>
          )}
          {(invoice.status === "発行済" || invoice.status === "送付済") && (
            <form action={markInvoicePaidAction.bind(null, id)} className="flex items-center gap-2">
              <Input name="paidDate" type="date" required className="w-40" />
              <Button type="submit" size="sm">
                入金済にする
              </Button>
            </form>
          )}
          {canCancel && invoice.status !== "取消" && invoice.status !== "再発行済" && (
            <form action={cancelInvoiceAction.bind(null, id)}>
              <Button type="submit" variant="danger" size="sm">
                取消
              </Button>
            </form>
          )}
          {canCancel && invoice.status === "取消" && (
            <form action={reissueInvoiceAction.bind(null, id)}>
              <Button type="submit" size="sm">
                再発行
              </Button>
            </form>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="請求明細" />
          <Table>
            <Thead>
              <tr>
                <Th>現場名</Th>
                <Th>請求区分</Th>
                <Th>金額</Th>
              </tr>
            </Thead>
            <tbody>
              {items.map((item) => (
                <Tr key={item.id}>
                  <Td>{item.siteName}</Td>
                  <Td>{item.billingType}</Td>
                  <Td>{formatCurrency(item.amount)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          <Card className="mt-5 border-0 shadow-none">
            <CardHeader title="PDF出力履歴" />
            {logs.length === 0 ? (
              <EmptyState>出力履歴がありません</EmptyState>
            ) : (
              <ul className="divide-y divide-gray-100 px-4">
                {logs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{l.fileName}</span>
                    <span className="text-xs text-gray-400">
                      {l.outputAt?.slice(0, 16).replace("T", " ")} / {l.outputBy}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Card>

        <Card>
          <CardHeader title="金額サマリ" />
          <div className="space-y-2 p-4 text-sm">
            <Row label="請求日" value={invoice.invoiceDate} />
            <Row label="支払期限" value={invoice.paymentDueDate ?? "-"} />
            <Row label="税抜合計" value={formatCurrency(invoice.subtotal)} />
            <Row label="消費税" value={formatCurrency(invoice.taxAmount)} />
            <Row label="税込合計" value={formatCurrency(invoice.totalAmount)} bold />
            <div className="my-2 border-t border-gray-100" />
            <Row label="原価合計" value={formatCurrency(invoice.costTotal)} />
            <Row label="粗利" value={formatCurrency(invoice.grossProfit)} />
            <Row label="間接経費" value={formatCurrency(invoice.overheadAmount)} />
            <Row label="簡易営業利益" value={formatCurrency(invoice.operatingProfit)} bold />
            {invoice.paidDate && <Row label="入金日" value={invoice.paidDate} />}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? "font-bold text-navy" : "font-medium"}>{value}</span>
    </div>
  );
}
