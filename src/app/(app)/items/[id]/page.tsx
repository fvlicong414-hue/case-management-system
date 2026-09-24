import { getItemMaster } from "@/lib/db/itemMaster";
import { listPriceTiersByItem } from "@/lib/db/itemPriceTiers";
import { updateItemMasterAction, upsertPriceTierAction, deletePriceTierAction } from "@/lib/actions/items";
import { Card, CardHeader, Field, Input, Button, PageHeader, EmptyState } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { formatCurrency } from "@/lib/calc";
import { AlertBanner } from "@/components/ui/alert";
import { notFound } from "next/navigation";

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, success } = await searchParams;
  const item = await getItemMaster(id);
  if (!item) notFound();
  const tiers = await listPriceTiersByItem(id);
  const boundUpdate = updateItemMasterAction.bind(null, id);
  const boundUpsertTier = upsertPriceTierAction.bind(null, id);

  return (
    <div>
      <PageHeader title="品目編集" subtitle={item.itemCode} />
      <AlertBanner error={error} success={success} />
      <Card>
        <CardHeader title="品目情報" />
        <form action={boundUpdate} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field label="品目コード" required>
            <Input name="itemCode" defaultValue={item.itemCode} required />
          </Field>
          <Field label="品目名" required>
            <Input name="name" defaultValue={item.name} required />
          </Field>
          <Field label="仕様">
            <Input name="specification" defaultValue={item.specification ?? ""} />
          </Field>
          <Field label="単位">
            <Input name="unit" defaultValue={item.unit ?? ""} />
          </Field>
          <Field label="標準売上単価" required>
            <Input name="defaultSalesPrice" type="number" step="1" defaultValue={item.defaultSalesPrice} required />
          </Field>
          <Field label="標準原価単価" required>
            <Input name="defaultCostPrice" type="number" step="1" defaultValue={item.defaultCostPrice} required />
          </Field>
          <Field label="カテゴリ">
            <Input name="category" defaultValue={item.category ?? ""} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit">保存</Button>
          </div>
        </form>
      </Card>

      <Card className="mt-5">
        <CardHeader
          title="得意先別単価(価格帯)"
          subtitle="Excel取り込みで登録されたA/H/M等の得意先別単価。見積作成時に選べます"
        />
        {tiers.length === 0 ? (
          <EmptyState>価格帯はまだ登録されていません</EmptyState>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>区分名</Th>
                <Th>単価</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {tiers.map((t) => (
                <Tr key={t.id}>
                  <Td>{t.tierName}</Td>
                  <Td>{formatCurrency(t.salesPrice)}</Td>
                  <Td>
                    <form action={deletePriceTierAction.bind(null, id, t.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        削除
                      </Button>
                    </form>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        <form action={boundUpsertTier} className="border-t border-gray-100 p-4">
          <p className="mb-2 text-xs font-medium text-gray-500">価格帯を追加・更新</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Input name="tierName" placeholder="区分名(例: A, H, M)" />
            <Input name="salesPrice" type="number" step="1" placeholder="単価" />
          </div>
          <div className="mt-2">
            <Button type="submit" size="sm">
              保存
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
