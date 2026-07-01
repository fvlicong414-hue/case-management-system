import { requireSession } from "@/lib/auth";
import { listCustomers } from "@/lib/db/customers";
import { listUnbilledSchedules } from "@/lib/db/billingSchedules";
import { createInvoiceAction } from "@/lib/actions/invoices";
import { formatCurrency } from "@/lib/calc";
import { Card, CardHeader, Field, Select, Button, PageHeader, EmptyState } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { AlertBanner } from "@/components/ui/alert";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; billingMonth?: string; error?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const customers = await listCustomers(session.tenantId);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const schedules =
    sp.customerId && sp.billingMonth
      ? await listUnbilledSchedules(session.tenantId, sp.customerId, sp.billingMonth)
      : [];

  return (
    <div>
      <PageHeader title="月次請求作成" subtitle="顧客と請求月を選んで、対象の請求予定をチェックしてください" />
      <AlertBanner error={sp.error} />

      <Card className="mb-5">
        <CardHeader title="1. 顧客・請求月を選択" />
        <form method="GET" className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <Field label="顧客" required>
            <Select name="customerId" required defaultValue={sp.customerId ?? ""}>
              <option value="">選択してください</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="請求月" required>
            <input
              type="month"
              name="billingMonth"
              required
              defaultValue={sp.billingMonth ?? currentMonth}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
            />
          </Field>
          <div className="flex items-end">
            <Button type="submit" size="sm">
              未請求の請求予定を表示
            </Button>
          </div>
        </form>
      </Card>

      {sp.customerId && sp.billingMonth && (
        <Card>
          <CardHeader title="2. 請求書に含める請求予定を選択" subtitle={`${sp.billingMonth} の未請求分`} />
          {schedules.length === 0 ? (
            <EmptyState>対象の請求予定がありません</EmptyState>
          ) : (
            <form action={createInvoiceAction}>
              <input type="hidden" name="customerId" value={sp.customerId} />
              <input type="hidden" name="billingMonth" value={sp.billingMonth} />
              <Table>
                <Thead>
                  <tr>
                    <Th></Th>
                    <Th>案件名</Th>
                    <Th>現場名</Th>
                    <Th>見積番号</Th>
                    <Th>区分</Th>
                    <Th>請求予定額</Th>
                    <Th>原価按分</Th>
                    <Th>粗利</Th>
                  </tr>
                </Thead>
                <tbody>
                  {schedules.map((s) => (
                    <Tr key={s.id}>
                      <Td>
                        <input type="checkbox" name="scheduleIds" value={s.id} defaultChecked />
                      </Td>
                      <Td>{s.projectName}</Td>
                      <Td>{s.siteName}</Td>
                      <Td>{s.estimateNo}</Td>
                      <Td>{s.billingType}</Td>
                      <Td>{formatCurrency(s.scheduledAmount)}</Td>
                      <Td>{formatCurrency(s.costAllocated)}</Td>
                      <Td>{formatCurrency(s.grossProfit)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <div className="border-t border-gray-100 p-4">
                <Button type="submit">チェックした請求予定で請求書を作成</Button>
              </div>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
