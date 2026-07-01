import { getItemMaster } from "@/lib/db/itemMaster";
import { updateItemMasterAction } from "@/lib/actions/items";
import { Card, CardHeader, Field, Input, Button, PageHeader } from "@/components/ui";
import { AlertBanner } from "@/components/ui/alert";
import { notFound } from "next/navigation";

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const item = await getItemMaster(id);
  if (!item) notFound();
  const boundUpdate = updateItemMasterAction.bind(null, id);

  return (
    <div>
      <PageHeader title="品目編集" subtitle={item.itemCode} />
      <AlertBanner error={error} />
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
    </div>
  );
}
