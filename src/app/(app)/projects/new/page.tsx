import { requireSession } from "@/lib/auth";
import { listCustomers } from "@/lib/db/customers";
import { createProjectAction } from "@/lib/actions/projects";
import { Card, CardHeader, Field, Input, Textarea, Select, Button, PageHeader } from "@/components/ui";
import { AlertBanner } from "@/components/ui/alert";

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await requireSession();
  const { error } = await searchParams;
  const customers = await listCustomers(session.tenantId);

  return (
    <div>
      <PageHeader title="新規案件登録" />
      <AlertBanner error={error} />
      <Card>
        <CardHeader title="案件情報" />
        <form action={createProjectAction} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field label="顧客" required>
            <Select name="customerId" required>
              <option value="">選択してください</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="案件名" required>
            <Input name="projectName" required />
          </Field>
          <Field label="現場名">
            <Input name="siteName" />
          </Field>
          <Field label="現場住所">
            <Input name="siteAddress" />
          </Field>
          <Field label="顧客側担当者">
            <Input name="customerContact" />
          </Field>
          <Field label="工事区分">
            <Input name="workCategory" placeholder="大規模修繕 / 塗装工事 など" />
          </Field>
          <Field label="着工予定日">
            <Input name="startPlanDate" type="date" />
          </Field>
          <Field label="完了予定日">
            <Input name="completionPlanDate" type="date" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="備考">
              <Textarea name="memo" rows={3} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">保存</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
