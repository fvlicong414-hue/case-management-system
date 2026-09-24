import { requireSession } from "@/lib/auth";
import { getAnnualReport } from "@/lib/db/reports";
import { formatCurrency } from "@/lib/calc";
import { Card, CardHeader, PageHeader, Select, Button } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import Link from "next/link";

export default async function AnnualReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = sp.year ? Number(sp.year) : currentYear;
  const report = await getAnnualReport(session.tenantId, year);

  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div>
      <PageHeader
        title="年間レポート"
        subtitle="年単位の売上・粗利・得意先別ランキング(税務署提出用データの元にもなります)"
      />

      <Card className="mb-5">
        <form className="flex flex-wrap items-end gap-3 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">対象年</label>
            <Select name="year" defaultValue={String(year)}>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" size="sm">
            表示
          </Button>
          <a href={`/api/csv/annual-invoices?year=${year}`} className="ml-auto">
            <Button type="button" variant="secondary" size="sm">
              この年のデータをCSV出力
            </Button>
          </a>
        </form>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={`${year}年 総売上`} value={formatCurrency(report.totalRevenue)} />
        <StatCard label={`${year}年 総粗利`} value={formatCurrency(report.totalGrossProfit)} />
        <StatCard label={`${year}年 簡易営業利益`} value={formatCurrency(report.totalOperatingProfit)} />
        <StatCard label="請求書件数" value={`${report.invoiceCount}件`} />
      </div>

      <Card className="mt-5">
        <CardHeader
          title={`${year}年 得意先別売上順位(上位10社)`}
          subtitle="毎年4月頃の提出資料などにそのまま活用できます"
        />
        <Table>
          <Thead>
            <tr>
              <Th>順位</Th>
              <Th>得意先名</Th>
              <Th>請求件数</Th>
              <Th>売上合計(税抜)</Th>
            </tr>
          </Thead>
          <tbody>
            {report.topCustomers.map((c, idx) => (
              <Tr key={c.customerId}>
                <Td>{idx + 1}</Td>
                <Td>
                  <Link href={`/customers/${c.customerId}`} className="text-navy hover:underline">
                    {c.customerName}
                  </Link>
                </Td>
                <Td>{c.invoiceCount}件</Td>
                <Td>{formatCurrency(c.totalAmount)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {report.topCustomers.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-gray-400">{year}年のデータがありません</p>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1.5 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
