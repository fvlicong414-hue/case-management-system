import { requireSession } from "@/lib/auth";
import { listPurchaseOrders } from "@/lib/db/purchaseOrders";
import { PageHeader, LinkButton, Card, StatusBadge, Input, Select, Button } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import Link from "next/link";

const STATUS_OPTIONS = ["下書き", "発行済", "送付済", "回答待ち", "完了", "取消"];

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ supplierName?: string; status?: string; orderType?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const orders = await listPurchaseOrders(session.tenantId, sp);

  return (
    <div>
      <PageHeader
        title="発注書・見積依頼書"
        subtitle={`${orders.length}件`}
        actions={<LinkButton href="/purchase-orders/new">+ 新規作成</LinkButton>}
      />

      <Card className="mb-4">
        <form className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <Input name="supplierName" placeholder="仕入先名" defaultValue={sp.supplierName} />
          <Select name="orderType" defaultValue={sp.orderType ?? ""}>
            <option value="">すべての種別</option>
            <option value="発注書">発注書</option>
            <option value="見積依頼書">見積依頼書</option>
          </Select>
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
              <Th>番号</Th>
              <Th>種別</Th>
              <Th>仕入先</Th>
              <Th>件名</Th>
              <Th>案件</Th>
              <Th>発注日</Th>
              <Th>状態</Th>
            </tr>
          </Thead>
          <tbody>
            {orders.map((o) => (
              <Tr key={o.id}>
                <Td>
                  <Link href={`/purchase-orders/${o.id}`} className="text-navy hover:underline">
                    {o.orderNo}
                  </Link>
                </Td>
                <Td>{o.orderType}</Td>
                <Td>{o.supplierName}</Td>
                <Td>{o.title}</Td>
                <Td>{o.projectName}</Td>
                <Td>{o.orderDate?.slice(0, 10)}</Td>
                <Td>
                  <StatusBadge status={o.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {orders.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-400">該当するデータがありません</p>}
      </Card>
    </div>
  );
}
