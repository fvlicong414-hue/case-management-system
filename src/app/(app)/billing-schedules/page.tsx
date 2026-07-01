import { requireSession } from "@/lib/auth";
import { listBillingSchedules } from "@/lib/db/billingSchedules";
import { formatCurrency } from "@/lib/calc";
import { PageHeader, Card, StatusBadge, Input, Select, Button } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";

const STATUS_OPTIONS = ["未請求", "請求書作成済", "発行済", "送付済", "入金済", "取消"];

export default async function BillingSchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ customerName?: string; billingMonth?: string; status?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const schedules = await listBillingSchedules(session.tenantId, sp);

  return (
    <div>
      <PageHeader title="請求予定一覧" subtitle={`${schedules.length}件`} />

      <Card className="mb-4">
        <form className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
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
          <Button type="submit" size="sm">
            検索
          </Button>
        </form>
      </Card>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>請求月</Th>
              <Th>顧客名</Th>
              <Th>案件名</Th>
              <Th>現場名</Th>
              <Th>見積番号</Th>
              <Th>区分</Th>
              <Th>請求予定額</Th>
              <Th>原価按分</Th>
              <Th>粗利</Th>
              <Th>状態</Th>
            </tr>
          </Thead>
          <tbody>
            {schedules.map((b) => (
              <Tr key={b.id}>
                <Td>{b.billingMonth}</Td>
                <Td>{b.customerName}</Td>
                <Td>{b.projectName}</Td>
                <Td>{b.siteName}</Td>
                <Td>{b.estimateNo}</Td>
                <Td>{b.billingType}</Td>
                <Td>{formatCurrency(b.scheduledAmount)}</Td>
                <Td>{formatCurrency(b.costAllocated)}</Td>
                <Td>{formatCurrency(b.grossProfit)}</Td>
                <Td>
                  <StatusBadge status={b.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {schedules.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-400">該当する請求予定がありません</p>}
      </Card>
    </div>
  );
}
