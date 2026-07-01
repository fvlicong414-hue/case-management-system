import { getEstimate, listEstimateItems } from "@/lib/db/estimates";
import { getProject } from "@/lib/db/projects";
import { getCustomer } from "@/lib/db/customers";
import { getSpecificationByEstimate } from "@/lib/db/specifications";
import { listBillingSchedulesByEstimate } from "@/lib/db/billingSchedules";
import { requireSession, can } from "@/lib/auth";
import { listItemMasters } from "@/lib/db/itemMaster";
import { formatCurrency, formatPercent } from "@/lib/calc";
import {
  updateEstimateHeaderAction,
  addEstimateItemAction,
  deleteEstimateItemAction,
  submitEstimateAction,
  markEstimateOrderedAction,
  markEstimateLostAction,
  cancelEstimateAction,
  duplicateEstimateAction,
} from "@/lib/actions/estimates";
import { saveSpecificationAction, publishSpecificationAction, cancelSpecificationAction } from "@/lib/actions/specifications";
import { createBillingSchedulesAction } from "@/lib/actions/billing";
import { Card, CardHeader, Field, Input, Textarea, Select, Button, PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { AlertBanner } from "@/components/ui/alert";
import { notFound } from "next/navigation";

export default async function EstimateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, success } = await searchParams;
  const session = await requireSession();
  const estimate = await getEstimate(id);
  if (!estimate) notFound();
  const project = await getProject(estimate.projectId);
  const customer = await getCustomer(estimate.customerId);
  const items = await listEstimateItems(id);
  const itemMasters = await listItemMasters(estimate.tenantId);
  const specification = await getSpecificationByEstimate(id);
  const billingSchedules = await listBillingSchedulesByEstimate(id);

  const editable = estimate.status === "作成中";
  const canCancel = can(session, "cancelReissue");

  const boundHeaderUpdate = updateEstimateHeaderAction.bind(null, id);
  const boundAddItem = addEstimateItemAction.bind(null, id);
  const boundSaveSpec = saveSpecificationAction.bind(null, id);

  const billingTotal = billingSchedules.reduce((s, b) => s + b.scheduledAmount, 0);

  return (
    <div>
      <PageHeader
        title={`見積 ${estimate.estimateNo}`}
        subtitle={`${project?.projectName ?? ""} / ${customer?.name ?? ""} (v${estimate.version})`}
        actions={<StatusBadge status={estimate.status} />}
      />
      <AlertBanner error={error} success={success} />

      <Card className="mb-5">
        <CardHeader title="操作" />
        <div className="flex flex-wrap gap-2 p-4">
          {editable && items.length > 0 && (
            <form action={submitEstimateAction.bind(null, id)}>
              <Button type="submit" size="sm">
                提出済にする
              </Button>
            </form>
          )}
          {estimate.status === "提出済" && (
            <>
              <form action={markEstimateOrderedAction.bind(null, id)}>
                <Button type="submit" size="sm">
                  受注にする
                </Button>
              </form>
              <form action={markEstimateLostAction.bind(null, id)}>
                <Button type="submit" variant="secondary" size="sm">
                  失注にする
                </Button>
              </form>
              <form action={duplicateEstimateAction.bind(null, id)}>
                <Button type="submit" variant="secondary" size="sm">
                  複製して新版作成
                </Button>
              </form>
            </>
          )}
          {canCancel && estimate.status !== "取消" && (
            <form action={cancelEstimateAction.bind(null, id)}>
              <Button type="submit" variant="danger" size="sm">
                取消
              </Button>
            </form>
          )}
          <a href={`/api/pdf/estimate/${id}`} target="_blank" rel="noreferrer">
            <Button type="button" variant="secondary" size="sm">
              見積書PDF出力
            </Button>
          </a>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="見積情報" />
          <form action={boundHeaderUpdate} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="件名">
              <Input name="title" defaultValue={estimate.title ?? ""} disabled={!editable} />
            </Field>
            <Field label="見積日" required>
              <Input name="estimateDate" type="date" defaultValue={estimate.estimateDate?.slice(0, 10)} disabled={!editable} required />
            </Field>
            <div className="sm:col-span-2">
              <Field label="備考">
                <Textarea name="memo" rows={2} defaultValue={estimate.memo ?? ""} disabled={!editable} />
              </Field>
            </div>
            {editable && (
              <div className="sm:col-span-2">
                <Button type="submit" size="sm">
                  見積情報を保存
                </Button>
              </div>
            )}
          </form>
        </Card>

        <Card>
          <CardHeader title="社内管理用サマリ" subtitle="顧客向けPDFには表示されません" />
          <div className="space-y-2 p-4 text-sm">
            <Row label="売上合計" value={formatCurrency(estimate.salesTotal)} />
            <Row label="原価合計" value={formatCurrency(estimate.costTotal)} />
            <Row label="粗利" value={formatCurrency(estimate.grossProfit)} />
            <Row label="粗利率" value={formatPercent(estimate.grossProfitRate)} />
            <Row label="間接経費" value={formatCurrency(estimate.overheadAmount)} />
            <Row label="簡易営業利益" value={formatCurrency(estimate.operatingProfit)} bold />
            <Row label="消費税" value={formatCurrency(estimate.taxAmount)} />
            <Row label="税込合計" value={formatCurrency(estimate.totalWithTax)} bold />
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="見積明細" subtitle={`${items.length}件`} />
        <Table>
          <Thead>
            <tr>
              <Th>品目</Th>
              <Th>仕様</Th>
              <Th>数量</Th>
              <Th>単位</Th>
              <Th>売上単価</Th>
              <Th>売上金額</Th>
              <Th>原価単価</Th>
              <Th>粗利</Th>
              {editable && <Th></Th>}
            </tr>
          </Thead>
          <tbody>
            {items.map((item) => (
              <Tr key={item.id}>
                <Td>{item.itemName}</Td>
                <Td>{item.specification}</Td>
                <Td>{item.quantity.toLocaleString("ja-JP")}</Td>
                <Td>{item.unit}</Td>
                <Td>{formatCurrency(item.salesUnitPrice)}</Td>
                <Td>{formatCurrency(item.salesAmount)}</Td>
                <Td>{formatCurrency(item.costUnitPrice)}</Td>
                <Td>{formatCurrency(item.grossProfit)}</Td>
                {editable && (
                  <Td>
                    <form action={deleteEstimateItemAction.bind(null, id, item.id)}>
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
        {items.length === 0 && <EmptyState>明細がまだありません</EmptyState>}

        {editable && (
          <form action={boundAddItem} className="border-t border-gray-100 p-4">
            <p className="mb-2 text-xs font-medium text-gray-500">明細を追加</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
              <Select name="itemMasterId" className="sm:col-span-2" defaultValue="">
                <option value="">品目マスターから選択(任意)</option>
                {itemMasters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
              <Input name="itemName" placeholder="品目名(未選択時は入力)" />
              <Input name="specification" placeholder="仕様" />
              <Input name="quantity" type="number" step="0.01" placeholder="数量" defaultValue={1} />
              <Input name="unit" placeholder="単位" />
              <Input name="salesUnitPrice" type="number" step="1" placeholder="売上単価" />
              <Input name="costUnitPrice" type="number" step="1" placeholder="原価単価" />
            </div>
            <div className="mt-2">
              <Button type="submit" size="sm">
                明細を追加
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card className="mt-5">
        <CardHeader title="仕様書" subtitle={specification ? `状態: ${specification.status}` : "未作成"} />
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
            <form action={publishSpecificationAction.bind(null, id, specification.id)}>
              <Button type="submit" size="sm">
                発行済にする
              </Button>
            </form>
          )}
          {specification && specification.status !== "取消" && canCancel && (
            <form action={cancelSpecificationAction.bind(null, id, specification.id)}>
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

      {estimate.status === "受注" && (
        <Card className="mt-5">
          <CardHeader
            title="請求予定作成"
            subtitle={
              billingSchedules.length > 0
                ? `作成済み ${billingSchedules.length}件 (合計 ${formatCurrency(billingTotal)})`
                : "通常請求は1行、分割請求は複数行に入力してください"
            }
          />
          {billingSchedules.length > 0 ? (
            <Table>
              <Thead>
                <tr>
                  <Th>請求月</Th>
                  <Th>区分</Th>
                  <Th>金額</Th>
                  <Th>原価按分</Th>
                  <Th>粗利</Th>
                  <Th>状態</Th>
                </tr>
              </Thead>
              <tbody>
                {billingSchedules.map((b) => (
                  <Tr key={b.id}>
                    <Td>{b.billingMonth}</Td>
                    <Td>{b.billingType}</Td>
                    <Td>{formatCurrency(b.scheduledAmount)}</Td>
                    <Td>{formatCurrency(b.costAllocated)}</Td>
                    <Td>{formatCurrency(b.grossProfit)}</Td>
                    <Td>
                      <StatusBadge status={b.status} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <form action={createBillingSchedulesAction.bind(null, id)} className="p-5">
              <input type="hidden" name="rowCount" value="5" />
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    <Select name={`billingType_${i}`} defaultValue={i === 0 ? "通常" : ""}>
                      <option value="">-</option>
                      <option value="通常">通常</option>
                      <option value="着手金">着手金</option>
                      <option value="中間金">中間金</option>
                      <option value="完了金">完了金</option>
                      <option value="追加">追加</option>
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
          )}
        </Card>
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
