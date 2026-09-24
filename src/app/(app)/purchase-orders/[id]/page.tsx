import { getPurchaseOrder, listPurchaseOrderItems } from "@/lib/db/purchaseOrders";
import { getProject } from "@/lib/db/projects";
import { requireSession, can } from "@/lib/auth";
import {
  addPurchaseOrderItemAction,
  deletePurchaseOrderItemAction,
  setPurchaseOrderStatusAction,
} from "@/lib/actions/purchaseOrders";
import { Card, CardHeader, Field, Input, Button, PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { AlertBanner } from "@/components/ui/alert";
import { notFound } from "next/navigation";
import type { PurchaseOrderStatus } from "@/lib/db/purchaseOrders";

const STATUS_FLOW: PurchaseOrderStatus[] = ["下書き", "発行済", "送付済", "回答待ち", "完了"];

export default async function PurchaseOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, success } = await searchParams;
  const session = await requireSession();
  const order = await getPurchaseOrder(id);
  if (!order) notFound();
  const items = await listPurchaseOrderItems(id);
  const project = order.projectId ? await getProject(order.projectId) : undefined;
  const canCancel = can(session, "cancelReissue");

  const boundAddItem = addPurchaseOrderItemAction.bind(null, id);

  return (
    <div>
      <PageHeader
        title={`${order.orderType} ${order.orderNo}`}
        subtitle={`仕入先: ${order.supplierName}${project ? ` / 関連案件: ${project.projectName}` : ""}`}
        actions={<StatusBadge status={order.status} />}
      />
      <AlertBanner error={error} success={success} />

      <Card className="mb-5">
        <CardHeader title="操作" />
        <div className="flex flex-wrap gap-2 p-4">
          {STATUS_FLOW.map((s) => (
            <form key={s} action={setPurchaseOrderStatusAction.bind(null, id, s)}>
              <Button type="submit" variant={order.status === s ? "primary" : "secondary"} size="sm">
                {s}にする
              </Button>
            </form>
          ))}
          {canCancel && (
            <form action={setPurchaseOrderStatusAction.bind(null, id, "取消")}>
              <Button type="submit" variant="danger" size="sm">
                取消
              </Button>
            </form>
          )}
          <a href={`/api/excel/purchase-order/${id}`} target="_blank" rel="noreferrer">
            <Button type="button" variant="secondary" size="sm">
              {order.orderType}Excel出力
            </Button>
          </a>
        </div>
      </Card>

      <Card>
        <CardHeader title="明細" subtitle={`${items.length}件`} />
        <Table>
          <Thead>
            <tr>
              <Th>品番</Th>
              <Th>品名</Th>
              <Th>仕様</Th>
              <Th>数量</Th>
              <Th>単位</Th>
              <Th>備考</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {items.map((item) => (
              <Tr key={item.id}>
                <Td>{item.itemCode}</Td>
                <Td>{item.itemName}</Td>
                <Td>{item.specification}</Td>
                <Td>{item.quantity}</Td>
                <Td>{item.unit}</Td>
                <Td>{item.memo}</Td>
                <Td>
                  <form action={deletePurchaseOrderItemAction.bind(null, id, item.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      削除
                    </Button>
                  </form>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {items.length === 0 && <EmptyState>明細がまだありません</EmptyState>}

        <form action={boundAddItem} className="border-t border-gray-100 p-4">
          <p className="mb-2 text-xs font-medium text-gray-500">明細を追加</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
            <Input name="itemCode" placeholder="品番(任意)" />
            <Input name="itemName" placeholder="品名" className="sm:col-span-2" />
            <Input name="specification" placeholder="仕様" />
            <Input name="quantity" type="number" step="0.01" placeholder="数量" defaultValue={1} />
            <Input name="unit" placeholder="単位" />
          </div>
          <Input name="memo" placeholder="備考" className="mt-2" />
          <div className="mt-2">
            <Button type="submit" size="sm">
              明細を追加
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
