import { getProject } from "@/lib/db/projects";
import { getCustomer } from "@/lib/db/customers";
import { listEstimatesByProject } from "@/lib/db/estimates";
import { listBillingSchedules } from "@/lib/db/billingSchedules";
import { listInvoices } from "@/lib/db/invoices";
import { updateProjectAction, changeProjectStatusAction } from "@/lib/actions/projects";
import { formatCurrency, formatPercent } from "@/lib/calc";
import { Card, CardHeader, Field, Input, Textarea, Button, LinkButton, PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { AlertBanner } from "@/components/ui/alert";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ProjectStatus } from "@/lib/db/types";

const STATUS_FLOW: ProjectStatus[] = ["見積中", "受注", "施工中", "完了", "請求中", "入金済"];

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, success } = await searchParams;
  const project = await getProject(id);
  if (!project) notFound();
  const customer = await getCustomer(project.customerId);
  const estimates = await listEstimatesByProject(id);
  const allBillingSchedules = await listBillingSchedules(project.tenantId);
  const billingSchedules = allBillingSchedules.filter((b) => b.projectId === id);
  const allInvoices = await listInvoices(project.tenantId);
  const invoices = allInvoices.filter((inv) => billingSchedules.some((b) => b.invoiceId === inv.id));

  const orderedEstimate = estimates.find((e) => e.status === "受注") || estimates[0];

  const boundUpdate = updateProjectAction.bind(null, id);

  return (
    <div>
      <PageHeader
        title={project.projectName}
        subtitle={`案件番号: ${project.projectCode} / 顧客: ${customer?.name ?? "-"}`}
        actions={<StatusBadge status={project.status} />}
      />
      <AlertBanner error={error} success={success} />

      <Card className="mb-5">
        <CardHeader title="ステータス変更" />
        <div className="flex flex-wrap gap-2 p-4">
          {STATUS_FLOW.map((s) => (
            <form key={s} action={changeProjectStatusAction.bind(null, id, s)}>
              <Button type="submit" variant={project.status === s ? "primary" : "secondary"} size="sm">
                {s}にする
              </Button>
            </form>
          ))}
          <form action={changeProjectStatusAction.bind(null, id, "失注")}>
            <Button type="submit" variant="danger" size="sm">
              失注にする
            </Button>
          </form>
          <form action={changeProjectStatusAction.bind(null, id, "保留")}>
            <Button type="submit" variant="secondary" size="sm">
              保留にする
            </Button>
          </form>
          <form action={changeProjectStatusAction.bind(null, id, "取消")}>
            <Button type="submit" variant="danger" size="sm">
              取消にする
            </Button>
          </form>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="案件情報" />
          <form action={boundUpdate} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="案件名" required>
              <Input name="projectName" defaultValue={project.projectName} required />
            </Field>
            <Field label="現場名">
              <Input name="siteName" defaultValue={project.siteName ?? ""} />
            </Field>
            <Field label="現場住所">
              <Input name="siteAddress" defaultValue={project.siteAddress ?? ""} />
            </Field>
            <Field label="顧客側担当者">
              <Input name="customerContact" defaultValue={project.customerContact ?? ""} />
            </Field>
            <Field label="工事区分">
              <Input name="workCategory" defaultValue={project.workCategory ?? ""} />
            </Field>
            <Field label="着工予定日">
              <Input name="startPlanDate" type="date" defaultValue={project.startPlanDate ?? ""} />
            </Field>
            <Field label="完了予定日">
              <Input name="completionPlanDate" type="date" defaultValue={project.completionPlanDate ?? ""} />
            </Field>
            <Field label="完了日">
              <Input name="completedDate" type="date" defaultValue={project.completedDate ?? ""} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="備考">
                <Textarea name="memo" rows={3} defaultValue={project.memo ?? ""} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">保存</Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="収益サマリ" subtitle="受注済み見積ベース" />
          {orderedEstimate ? (
            <div className="space-y-2 p-4 text-sm">
              <Row label="売上合計" value={formatCurrency(orderedEstimate.salesTotal)} />
              <Row label="原価合計" value={formatCurrency(orderedEstimate.costTotal)} />
              <Row label="粗利" value={formatCurrency(orderedEstimate.grossProfit)} />
              <Row label="粗利率" value={formatPercent(orderedEstimate.grossProfitRate)} />
              <Row label="間接経費" value={formatCurrency(orderedEstimate.overheadAmount)} />
              <Row label="簡易営業利益" value={formatCurrency(orderedEstimate.operatingProfit)} bold />
            </div>
          ) : (
            <EmptyState>見積がまだありません</EmptyState>
          )}
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="見積一覧" actions={<LinkButton href={`/estimates/new?projectId=${id}`} size="sm">+ 見積作成</LinkButton>} />
          {estimates.length === 0 ? (
            <EmptyState>見積がまだありません</EmptyState>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>見積番号</Th>
                  <Th>金額</Th>
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
                    <Td>{formatCurrency(e.salesTotal)}</Td>
                    <Td>
                      <StatusBadge status={e.status} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="請求予定・請求履歴" />
          {billingSchedules.length === 0 ? (
            <EmptyState>請求予定がまだありません</EmptyState>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>請求月</Th>
                  <Th>区分</Th>
                  <Th>金額</Th>
                  <Th>状態</Th>
                </tr>
              </Thead>
              <tbody>
                {billingSchedules.map((b) => (
                  <Tr key={b.id}>
                    <Td>{b.billingMonth}</Td>
                    <Td>{b.billingType}</Td>
                    <Td>{formatCurrency(b.scheduledAmount)}</Td>
                    <Td>
                      <StatusBadge status={b.status} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
          {invoices.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-3">
              <p className="mb-2 text-xs font-medium text-gray-500">関連する請求書</p>
              <div className="space-y-1">
                {invoices.map((inv) => (
                  <Link key={inv.id} href={`/invoices/${inv.id}`} className="block text-sm text-navy hover:underline">
                    {inv.invoiceNo} - {formatCurrency(inv.totalAmount)}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? "font-bold text-navy" : "font-medium"}>{value}</span>
    </div>
  );
}
