import { requireSession } from "@/lib/auth";
import { listProjects } from "@/lib/db/projects";
import { createEstimateAction } from "@/lib/actions/estimates";
import { Card, CardHeader, Field, Input, Textarea, Select, Button, PageHeader } from "@/components/ui";
import { AlertBanner } from "@/components/ui/alert";

export default async function NewEstimatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; projectId?: string }>;
}) {
  const session = await requireSession();
  const { error, projectId } = await searchParams;
  const projects = await listProjects(session.tenantId);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title="新規見積作成" />
      <AlertBanner error={error} />
      <Card>
        <CardHeader title="見積情報" />
        <form action={createEstimateAction} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field label="案件" required>
            <Select name="projectId" required defaultValue={projectId ?? ""}>
              <option value="">選択してください</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName}({p.customerName})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="見積日" required>
            <Input name="estimateDate" type="date" defaultValue={today} required />
          </Field>
          <div className="sm:col-span-2">
            <Field label="件名">
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
