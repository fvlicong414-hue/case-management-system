import { requireSession } from "@/lib/auth";
import { listProjects } from "@/lib/db/projects";
import { createPurchaseOrderAction } from "@/lib/actions/purchaseOrders";
import { Card, CardHeader, Field, Input, Textarea, Select, Button, PageHeader } from "@/components/ui";
import { AlertBanner } from "@/components/ui/alert";

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  const { error } = await searchParams;
  const projects = await listProjects(session.tenantId);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title="発注書・見積依頼書 新規作成" />
      <AlertBanner error={error} />
      <Card>
        <CardHeader title="基本情報" />
        <form action={createPurchaseOrderAction} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field label="種別" required>
            <Select name="orderType" required defaultValue="発注書">
              <option value="発注書">発注書(仕入先へ注文する)</option>
              <option value="見積依頼書">見積依頼書(仕入先へ数量・価格を問い合わせる)</option>
            </Select>
          </Field>
          <Field label="仕入先名" required>
            <Input name="supplierName" required />
          </Field>
          <Field label="関連案件(任意)">
            <Select name="projectId" defaultValue="">
              <option value="">選択しない</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName}({p.customerName})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="発注日" required>
            <Input name="orderDate" type="date" defaultValue={today} required />
          </Field>
          <div className="sm:col-span-2">
            <Field label="件名(工事名)">
              <Input name="title" placeholder="外壁改修一式 など" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="備考">
              <Textarea name="memo" rows={3} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">作成して明細入力へ</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
