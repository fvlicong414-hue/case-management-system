import { requireSession } from "@/lib/auth";
import { listInvoices } from "@/lib/db/invoices";
import { formatCurrency } from "@/lib/calc";
import { PageHeader, LinkButton, Card, StatusBadge, Input, Select, Button } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import Link from "next/link";

const STATUS_OPTIONS = ["下書き", "発行済", "送付済", "入金済", "取消", "再発行済"];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    invoiceNo?: string;
    customerName?: string;
    billingMonth?: string;
    status?: string;
    paidDateFrom?: string;
    paidDateTo?: string;
  }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const invoices = await listInvoices(session.tenantId, sp);

  return (
    <div>
      <PageHeader title="請求書管理" subtitle={`${invoices.length}件`} actions={<LinkButton href="/invoices/new">+ 月次請求作成</LinkButton>} />

      <Card className="mb-4">
        <form className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-5">
          <Input name="invoiceNo" placeholder="請求番号" defaultValue={sp.invoiceNo} />
          <Input name="customerName" placeholder="顧客名" defaultValue={sp.customerName} />
          <Input name="billingMonth" type="month" defaultValue={sp.billingMonth} />
          <Select name="status" defaultValue={sp.status ?? ""}>
            <option value="">すべてのステータス</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <div>
            <Button type="submit" size="sm">
              検索
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>請求番号</Th>
              <Th>顧客名</Th>
              <Th>請求月</Th>
              <Th>金額</Th>
              <Th>状態</Th>
              <Th>入金日</Th>
            </tr>
          </Thead>
          <tbody>
            {invoices.map((inv) => (
              <Tr key={inv.id}>
                <Td>
                  <Link href={`/invoices/${inv.id}`} className="text-navy hover:underline">
                    {inv.invoiceNo}
                  </Link>
                </Td>
                <Td>{inv.customerName}</Td>
                <Td>{inv.billingMonth}</Td>
                <Td>{formatCurrency(inv.totalAmount)}</Td>
                <Td>
                  <StatusBadge status={inv.status} />
                </Td>
                <Td>{inv.paidDate}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {invoices.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-400">該当する請求書がありません</p>}
      </Card>
    </div>
  );
}
