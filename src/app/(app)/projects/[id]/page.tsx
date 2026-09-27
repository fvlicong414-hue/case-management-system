import { getProject } from "@/lib/db/projects";
import { getCustomer } from "@/lib/db/customers";
import { listEstimatesByProject, listEstimateItems } from "@/lib/db/estimates";
import { getSpecificationByEstimate } from "@/lib/db/specifications";
import { listBillingSchedulesByEstimate } from "@/lib/db/billingSchedules";
import { listInvoices } from "@/lib/db/invoices";
import { requireSession, can } from "@/lib/auth";
import { updateProjectAction, changeProjectStatusAction } from "@/lib/actions/projects";
import { importEstimateAndCompleteProjectAction } from "@/lib/actions/estimateImport";
import { cancelEstimateAction } from "@/lib/actions/estimates";
import { saveSpecificationAction, publishSpecificationAction, cancelSpecificationAction } from "@/lib/actions/specifications";
import { createBillingSchedulesAction, addBillingScheduleRowAction, editBillingScheduleAction, deleteBillingScheduleAction } from "@/lib/actions/billing";
import { formatCurrency, formatPercent } from "@/lib/calc";
import { Card, CardHeader, Field, Input, Textarea, Select, Button, PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { ImportSubmitButton } from "@/components/estimates/ImportSubmitButton";
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
  const session = await requireSession();
  const project = await getProject(id);
  if (!project) notFound();
  const customer = await getCustomer(project.customerId);
  const estimates = await listEstimatesByProject(id);
  const allInvoices = await listInvoices(project.tenantId);

  // このシステムでは「見積り読み取り」1回につき見積1件が作られる想定。
  // 受注済みのものを優先し、なければ最新のものを案件の代表として扱う。
  const estimate = estimates.find((e) => e.status === "受注") || estimates[0];
  const canCancel = can(session, "cancelReissue");

  const boundUpdate = updateProjectAction.bind(null, id);
  const boundImport = importEstimateAndCompleteProjectAction.bind(null);

  const items = estimate ? await listEstimateItems(estimate.id) : [];
  const specification = estimate ? await getSpecificationByEstimate(estimate.id) : null;
  const billingSchedules = estimate ? await listBillingSchedulesByEstimate(estimate.id) : [];
  const billingTotal = billingSchedules.reduce((s, b) => s + b.scheduledAmount, 0);
  const invoices = allInvoices.filter((inv) => billingSchedules.some((b) => b.invoiceId === inv.id));

  const boundSaveSpec = estimate ? saveSpecificationAction.bind(null, estimate.id) : undefined;

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
          {estimate ? (
            <div className="space-y-2 p-4 text-sm">
              <Row label="売上合計" value={formatCurrency(estimate.salesTotal)} />
              <Row label="原価合計" value={formatCurrency(estimate.costTotal)} />
              <Row label="粗利" value={formatCurrency(estimate.grossProfit)} />
              <Row label="粗利率" value={formatPercent(estimate.grossProfitRate)} />
              <Row label="間接経費" value={formatCurrency(estimate.overheadAmount)} />
              <Row label="簡易営業利益" value={formatCurrency(estimate.operatingProfit)} bold />
            </div>
          ) : (
            <EmptyState>見積がまだありません</EmptyState>
          )}
        </Card>
      </div>

      {!estimate ? (
        <Card className="mt-5">
          <CardHeader
            title="見積り読み取り"
            subtitle="Excelの見積書を読み込むと、明細の取り込み・案件情報の反映・案件の完了・請求予定の作成までを自動で行います"
          />
          <form action={boundImport} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <input type="hidden" name="projectId" value={id} />
            <Field label="見積日" required>
              <Input name="estimateDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Excelファイル(.xlsx)" required>
                <Input name="file" type="file" accept=".xlsx" required />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <ImportSubmitButton
                idleLabel="Excelを読み取って案件を完了にする"
                pendingLabel="読み取り中…(数分かかる場合があります)"
              />
            </div>
          </form>
        </Card>
      ) : (
        <>
          <Card className="mt-5">
            <CardHeader title="見積" subtitle={`${estimate.estimateNo}(v${estimate.version})`} actions={<StatusBadge status={estimate.status} />} />
            <div className="flex flex-wrap gap-2 p-4">
              {canCancel && estimate.status !== "取消" && (
                <form action={cancelEstimateAction.bind(null, estimate.id)}>
                  <Button type="submit" variant="danger" size="sm">
                    見積を取消
                  </Button>
                </form>
              )}
              <a href={`/api/pdf/estimate/${estimate.id}`} target="_blank" rel="noreferrer">
                <Button type="button" variant="secondary" size="sm">
                  見積書PDF出力
                </Button>
              </a>
              <a href={`/api/excel/estimate-package/${estimate.id}`} target="_blank" rel="noreferrer">
                <Button type="button" variant="secondary" size="sm">
                  見積書・手配書・指示書 まとめてExcel出力
                </Button>
              </a>
            </div>
            <Table>
              <Thead>
                <tr>
                  <Th>品目</Th>
                  <Th>数量</Th>
                  <Th>単位</Th>
                  <Th>売上単価</Th>
                  <Th>売上金額</Th>
                  <Th>原価単価</Th>
                  <Th>粗利</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((item) => (
                  <Tr key={item.id}>
                    <Td>{item.itemName}</Td>
                    <Td>{item.quantity.toLocaleString("ja-JP")}</Td>
                    <Td>{item.unit}</Td>
                    <Td>{formatCurrency(item.salesUnitPrice)}</Td>
                    <Td>{formatCurrency(item.salesAmount)}</Td>
                    <Td>{formatCurrency(item.costUnitPrice)}</Td>
                    <Td>{formatCurrency(item.grossProfit)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            {items.length === 0 && <EmptyState>明細がまだありません</EmptyState>}
            <p className="px-4 pb-4 text-xs text-gray-500">
              原価単価はExcel取り込み時点では0円のため、必要に応じて内容をご確認のうえ、修正が必要な場合はご連絡ください。
            </p>
          </Card>

          <Card className="mt-5">
            <CardHeader title="仕様書" subtitle="施工範囲・使用材料・注意事項など(お客様向け)" />
            <form action={boundSaveSpec} className="grid grid-cols-1 gap-4 p-5">
              <Field label="施工範囲">
                <Textarea name="constructionScope" rows={2} defaultValue={specification?.constructionScope ?? ""} disabled={specification?.status !== undefined && specification.status !== "作成中"} />
              </Field>
              <Field label="使用材料">
                <Textarea name="materials" rows={2} defaultValue={specification?.materials ?? ""} disabled={specification?.status !== undefined && specification.status !== "作成中"} />
              </Field>
              <Field label="施工方法">
                <Textarea name="method" rows={2} defaultValue={specification?.method ?? ""} disabled={specification?.status !== undefined && specification.status !== "作成中"} />
              </Field>
              <Field label="注意事項">
                <Textarea name="notes" rows={2} defaultValue={specification?.notes ?? ""} disabled={specification?.status !== undefined && specification.status !== "作成中"} />
              </Field>
              <Field label="保証・補足">
                <Textarea name="warranty" rows={2} defaultValue={specification?.warranty ?? ""} disabled={specification?.status !== undefined && specification.status !== "作成中"} />
              </Field>
              <div className="flex flex-wrap gap-2">
                {(!specification || specification.status === "作成中") && (
                  <Button type="submit" size="sm">
                    仕様書を保存
                  </Button>
                )}
              </div>
            </form>
            <div className="flex flex-wrap gap-2 border-t border-gray-100 p-4">
              {specification && specification.status === "作成中" && (
                <form action={publishSpecificationAction.bind(null, estimate.id, specification.id)}>
                  <Button type="submit" size="sm">
                    発行済にする
                  </Button>
                </form>
              )}
              {specification && specification.status !== "取消" && canCancel && (
                <form action={cancelSpecificationAction.bind(null, estimate.id, specification.id)}>
                  <Button type="submit" variant="danger" size="sm">
                    仕様書を取消
                  </Button>
                </form>
              )}
              {specification && (
                <a href={`/api/pdf/specification/${specification.id}`} target="_blank" rel="noreferrer">
                  <Button type="button" variant="secondary" size="sm">
                    仕様書PDF出力
                  </Button>
                </a>
              )}
            </div>
          </Card>

          <Card className="mt-5">
            <CardHeader
              title="請求予定"
              subtitle={
                billingSchedules.length > 0
                  ? `作成済み ${billingSchedules.length}件 (合計 ${formatCurrency(billingTotal)})`
                  : "案件を完了にすると、見積金額をもとに自動作成されます"
              }
            />
            {billingSchedules.length > 0 && (
              <Table>
                <Thead>
                  <tr>
                    <Th>請求月</Th>
                    <Th>区分</Th>
                    <Th>金額</Th>
                    <Th>原価按分</Th>
                    <Th>粗利</Th>
                    <Th>状態</Th>
                    <Th></Th>
                  </tr>
                </Thead>
                <tbody>
                  {billingSchedules.map((b) => (
                    <Tr key={b.id}>
                      {b.status === "未請求" && !b.invoiceId ? (
                        <form action={editBillingScheduleAction.bind(null, estimate.id, b.id)} className="contents">
                          <Td>
                            <Input name="billingMonth" type="month" defaultValue={b.billingMonth} className="w-32" />
                          </Td>
                          <Td>
                            <Select name="billingType" defaultValue={b.billingType} className="w-24">
                              <option value="出来高">出来高</option>
                              <option value="完了金">完了金</option>
                            </Select>
                          </Td>
                          <Td>
                            <Input name="scheduledAmount" type="number" step="1" defaultValue={b.scheduledAmount} className="w-28" />
                          </Td>
                          <Td>{formatCurrency(b.costAllocated)}</Td>
                          <Td>{formatCurrency(b.grossProfit)}</Td>
                          <Td>
                            <StatusBadge status={b.status} />
                          </Td>
                          <Td>
                            <Button type="submit" size="sm" variant="secondary">
                              更新
                            </Button>
                          </Td>
                        </form>
                      ) : (
                        <>
                          <Td>{b.billingMonth}</Td>
                          <Td>{b.billingType}</Td>
                          <Td>{formatCurrency(b.scheduledAmount)}</Td>
                          <Td>{formatCurrency(b.costAllocated)}</Td>
                          <Td>{formatCurrency(b.grossProfit)}</Td>
                          <Td>
                            <StatusBadge status={b.status} />
                          </Td>
                          <Td></Td>
                        </>
                      )}
                      {b.status === "未請求" && !b.invoiceId && (
                        <Td>
                          <form action={deleteBillingScheduleAction.bind(null, estimate.id, b.id)}>
                            <Button type="submit" variant="ghost" size="sm">
                              削除
                            </Button>
                          </form>
                        </Td>
                      )}
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}

            {billingSchedules.length === 0 ? (
              <form action={createBillingSchedulesAction.bind(null, estimate.id)} className="p-5">
                <input type="hidden" name="rowCount" value="5" />
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      <Select name={`billingType_${i}`} defaultValue={i === 0 ? "完了金" : ""}>
                        <option value="">-</option>
                        <option value="出来高">出来高</option>
                        <option value="完了金">完了金</option>
                      </Select>
                      <Input name={`billingMonth_${i}`} type="month" />
                      <Input name={`scheduledAmount_${i}`} type="number" step="1" placeholder="請求予定額" />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500">見積金額: {formatCurrency(estimate.salesTotal)}(合計が一致しない場合は警告が表示されます)</p>
                {canCancel && (
                  <label className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                    <input type="checkbox" name="allowMismatch" /> 金額差異があっても保存する(管理者のみ)
                  </label>
                )}
                <div className="mt-3">
                  <Button type="submit" size="sm">
                    請求予定を作成
                  </Button>
                </div>
              </form>
            ) : (
              <form action={addBillingScheduleRowAction.bind(null, estimate.id)} className="border-t border-gray-100 p-4">
                <p className="mb-2 text-xs font-medium text-gray-500">
                  行を追加(追加工事はプラス、未使用部材の削減はマイナスの金額で入力してください)
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Select name="billingType" defaultValue="完了金">
                    <option value="出来高">出来高</option>
                    <option value="完了金">完了金</option>
                  </Select>
                  <Input name="billingMonth" type="month" />
                  <Input name="scheduledAmount" type="number" step="1" placeholder="金額(マイナス可)" />
                  <Button type="submit" size="sm">
                    追加
                  </Button>
                </div>
              </form>
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
        </>
      )}
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
