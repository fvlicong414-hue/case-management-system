import { requireSession } from "@/lib/auth";
import { listEstimates } from "@/lib/db/estimates";
import { formatCurrency } from "@/lib/calc";
import { PageHeader, LinkButton, Card, StatusBadge, Input, Select, Button } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import Link from "next/link";

const STATUS_OPTIONS = ["作成中", "提出済", "受注", "失注", "取消"];

export default async function EstimatesPage({
  searchParams,
}: {
  searchParams: Promise<{ estimateNo?: string; projectName?: string; customerName?: string; status?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const estimates = await listEstimates(session.tenantId, sp);

  return (
    <div>
      <PageHeader title="見積管理" subtitle={`${estimates.length}件`} actions={<LinkButton href="/estimates/new">+ 新規見積作成</LinkButton>} />

      <Card className="mb-4">
        <form className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-5">
          <Input name="estimateNo" placeholder="見積番号" defaultValue={sp.estimateNo} />
          <Input name="projectName" placeholder="案件名" defaultValue={sp.projectName} />
          <Input name="customerName" placeholder="顧客名" defaultValue={sp.customerName} />
          <Select name="status" defaultValue={sp.status ?? ""}>
            <option value="">すべてのステータス</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Input name="dateFrom" type="date" defaultValue={sp.dateFrom} />
            <Input name="dateTo" type="date" defaultValue={sp.dateTo} />
          </div>
          <div className="col-span-2 sm:col-span-5">
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
              <Th>見積番号</Th>
              <Th>案件名</Th>
              <Th>顧客名</Th>
              <Th>見積日</Th>
              <Th>金額</Th>
              <Th>粗利率</Th>
              <Th>状態</Th>
            </tr>
          </Thead>
          <tbody>
            {estimates.map((e) => (
              <Tr key={e.id}>
                <Td>
                  <Link href={`/estimates/${e.id}`} className="text-navy hover:underline">
                    {e.estimateNo}
                  </Link>
                </Td>
                <Td>{e.projectName}</Td>
                <Td>{e.customerName}</Td>
                <Td>{e.estimateDate?.slice(0, 10)}</Td>
                <Td>{formatCurrency(e.totalWithTax)}</Td>
                <Td>{(e.grossProfitRate * 100).toFixed(1)}%</Td>
                <Td>
                  <StatusBadge status={e.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {estimates.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-400">該当する見積がありません</p>}
      </Card>
    </div>
  );
}
