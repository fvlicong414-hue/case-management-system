import { requireSession } from "@/lib/auth";
import { listItemMasters } from "@/lib/db/itemMaster";
import { formatCurrency } from "@/lib/calc";
import { PageHeader, LinkButton, Card, StatusBadge, Input, Button } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { AlertBanner } from "@/components/ui/alert";
import { toggleItemActiveAction } from "@/lib/actions/items";
import Link from "next/link";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; itemCode?: string; category?: string; unit?: string; error?: string; success?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const items = await listItemMasters(session.tenantId, { ...sp, includeInactive: true });

  return (
    <div>
      <PageHeader
        title="品目マスター"
        subtitle={`${items.length}件`}
        actions={<LinkButton href="/items/new">+ 新規品目登録</LinkButton>}
      />
      <AlertBanner error={sp.error} success={sp.success} />

      <Card className="mb-4">
        <form className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <Input name="name" placeholder="品目名" defaultValue={sp.name} />
          <Input name="itemCode" placeholder="品目コード" defaultValue={sp.itemCode} />
          <Input name="category" placeholder="カテゴリ" defaultValue={sp.category} />
          <Input name="unit" placeholder="単位" defaultValue={sp.unit} />
          <div className="col-span-2 sm:col-span-4">
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
              <Th>品目コード</Th>
              <Th>品目名</Th>
              <Th>仕様</Th>
              <Th>単位</Th>
              <Th>標準売上単価</Th>
              <Th>標準原価単価</Th>
              <Th>カテゴリ</Th>
              <Th>状態</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {items.map((item) => (
              <Tr key={item.id}>
                <Td>
                  <Link href={`/items/${item.id}`} className="text-navy hover:underline">
                    {item.itemCode}
                  </Link>
                </Td>
                <Td>{item.name}</Td>
                <Td>{item.specification}</Td>
                <Td>{item.unit}</Td>
                <Td>{formatCurrency(item.defaultSalesPrice)}</Td>
                <Td>{formatCurrency(item.defaultCostPrice)}</Td>
                <Td>{item.category}</Td>
                <Td>
                  <StatusBadge status={item.isActive ? "有効" : "無効"} />
                </Td>
                <Td>
                  <form action={toggleItemActiveAction.bind(null, item.id, !item.isActive)}>
                    <Button type="submit" variant="ghost" size="sm">
                      {item.isActive ? "無効化" : "有効化"}
                    </Button>
                  </form>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {items.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-400">該当する品目がありません</p>}
      </Card>
    </div>
  );
}
