import { PageHeader, Card, CardHeader, Button } from "@/components/ui";

const EXPORTS = [
  { key: "customers", label: "顧客" },
  { key: "projects", label: "案件" },
  { key: "item-master", label: "品目マスター" },
  { key: "item-price-tiers", label: "品目 得意先別単価" },
  { key: "estimates", label: "見積" },
  { key: "estimate-items", label: "見積明細" },
  { key: "specifications", label: "仕様書" },
  { key: "billing-schedules", label: "請求予定" },
  { key: "invoices", label: "請求書" },
  { key: "invoice-items", label: "請求明細" },
  { key: "purchase-orders", label: "発注書・見積依頼書" },
  { key: "purchase-order-items", label: "発注明細" },
  { key: "document-logs", label: "PDF出力履歴" },
];

export default function ExportPage() {
  return (
    <div>
      <PageHeader title="CSVエクスポート" subtitle="ダウンロードしたいデータを選択してください" />
      <Card>
        <CardHeader title="エクスポート項目" />
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          {EXPORTS.map((e) => (
            <a key={e.key} href={`/api/csv/${e.key}`} className="block">
              <div className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3 hover:border-navy hover:bg-navy/5">
                <span className="text-sm font-medium text-gray-800">{e.label}</span>
                <Button type="button" variant="secondary" size="sm">
                  CSV出力
                </Button>
              </div>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
