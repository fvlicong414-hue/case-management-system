import { createItemMasterAction } from "@/lib/actions/items";
import { Card, CardHeader, Field, Input, Button, PageHeader } from "@/components/ui";
import { AlertBanner } from "@/components/ui/alert";

export default async function NewItemPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div>
      <PageHeader title="新規品目登録" />
      <AlertBanner error={error} />
      <Card>
        <CardHeader title="品目情報" />
        <form action={createItemMasterAction} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field label="品目コード" required>
            <Input name="itemCode" required placeholder="I0001" />
          </Field>
          <Field label="品目名" required>
            <Input name="name" required />
          </Field>
          <Field label="仕様">
            <Input name="specification" />
          </Field>
          <Field label="単位">
            <Input name="unit" placeholder="m2 / m / 式 など" />
          </Field>
          <Field label="標準売上単価" required>
            <Input name="defaultSalesPrice" type="number" step="1" required />
          </Field>
          <Field label="標準原価単価" required>
            <Input name="defaultCostPrice" type="number" step="1" required />
          </Field>
          <Field label="カテゴリ">
            <Input name="category" />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit">保存</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
