import { requireSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/db/dashboard";
import { formatCurrency, formatPercent } from "@/lib/calc";
import { Card, CardHeader, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import Link from "next/link";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1.5 text-xl font-bold text-gray-900">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardData(session.tenantId);
  const now = new Date();
  const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  return (
    <div>
      <PageHeader title="ダッシュボード" subtitle={`${monthLabel}の状況`} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="顧客件数" value={`${data.customerCount}件`} />
        <StatCard label="案件件数" value={`${data.projectCount}件`} />
        <StatCard label="今月の見積提出額" value={formatCurrency(data.monthEstimateSubmitted)} />
        <StatCard label="今月の受注金額" value={formatCurrency(data.monthOrderedAmount)} />
        <StatCard label="今月の請求予定額" value={formatCurrency(data.monthBillingScheduled)} />
        <StatCard label="今月の請求済額" value={formatCurrency(data.monthBilled)} />
        <StatCard label="今月の粗利" value={formatCurrency(data.monthGrossProfit)} />
        <StatCard label="今月の簡易営業利益" value={formatCurrency(data.monthOperatingProfit)} />
        <StatCard label="未請求件数" value={`${data.unbilledCount}件`} hint="請求予定のうち未請求" />
        <StatCard label="入金待ち件数" value={`${data.waitingPaymentCount}件`} hint="発行済・送付済の請求書" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="支払期限超過の請求書" />
          {data.overdueInvoices.length === 0 ? (
            <EmptyState>支払期限超過の請求書はありません</EmptyState>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>請求番号</Th>
                  <Th>顧客名</Th>
                  <Th>金額</Th>
                  <Th>期限</Th>
                </tr>
              </Thead>
              <tbody>
                {data.overdueInvoices.map((inv) => (
                  <Tr key={inv.id}>
                    <Td>
                      <Link href={`/invoices/${inv.id}`} className="text-navy hover:underline">
                        {inv.invoiceNo}
                      </Link>
                    </Td>
                    <Td>{inv.customerName}</Td>
                    <Td>{formatCurrency(inv.totalAmount)}</Td>
                    <Td className="text-red-600">{inv.paymentDueDate}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="粗利率が低い受注案件" subtitle="受注済み見積のうち粗利率の低い順" />
          {data.lowMarginProjects.length === 0 ? (
            <EmptyState>データがありません</EmptyState>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>案件名</Th>
                  <Th>顧客名</Th>
                  <Th>売上</Th>
                  <Th>粗利率</Th>
                </tr>
              </Thead>
              <tbody>
                {data.lowMarginProjects.map((p, idx) => (
                  <Tr key={idx}>
                    <Td>{p.projectName}</Td>
                    <Td>{p.customerName}</Td>
                    <Td>{formatCurrency(p.salesTotal)}</Td>
                    <Td className={p.grossProfitRate < 0.2 ? "text-red-600 font-medium" : ""}>
                      {formatPercent(p.grossProfitRate)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="直近の見積" actions={<Link href="/estimates" className="text-xs text-navy hover:underline">すべて見る</Link>} />
          {data.recentEstimates.length === 0 ? (
            <EmptyState>見積がまだありません</EmptyState>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>見積番号</Th>
                  <Th>顧客名</Th>
                  <Th>金額</Th>
                  <Th>状態</Th>
                </tr>
              </Thead>
              <tbody>
                {data.recentEstimates.map((e) => (
                  <Tr key={e.id}>
                    <Td>
                      <Link href={`/estimates/${e.id}`} className="text-navy hover:underline">
                        {e.estimateNo}
                      </Link>
                    </Td>
                    <Td>{e.customerName}</Td>
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
          <CardHeader title="直近の請求書" actions={<Link href="/invoices" className="text-xs text-navy hover:underline">すべて見る</Link>} />
          {data.recentInvoices.length === 0 ? (
            <EmptyState>請求書がまだありません</EmptyState>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>請求番号</Th>
                  <Th>顧客名</Th>
                  <Th>金額</Th>
                  <Th>状態</Th>
                </tr>
              </Thead>
              <tbody>
                {data.recentInvoices.map((inv) => (
                  <Tr key={inv.id}>
                    <Td>
                      <Link href={`/invoices/${inv.id}`} className="text-navy hover:underline">
                        {inv.invoiceNo}
                      </Link>
                    </Td>
                    <Td>{inv.customerName}</Td>
                    <Td>{formatCurrency(inv.totalAmount)}</Td>
                    <Td>
                      <StatusBadge status={inv.status} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
