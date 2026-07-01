import { requireSession } from "@/lib/auth";
import { listDocumentLogs } from "@/lib/db/documentLogs";
import { PageHeader, Card, StatusBadge, Select, Input, Button } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";

export default async function DocumentLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ documentType?: "見積書" | "仕様書" | "請求書"; dateFrom?: string; dateTo?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const logs = await listDocumentLogs(session.tenantId, sp);

  return (
    <div>
      <PageHeader title="PDF出力履歴" subtitle={`${logs.length}件`} />

      <Card className="mb-4">
        <form className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <Select name="documentType" defaultValue={sp.documentType ?? ""}>
            <option value="">すべての帳票種別</option>
            <option value="見積書">見積書</option>
            <option value="仕様書">仕様書</option>
            <option value="請求書">請求書</option>
          </Select>
          <Input name="dateFrom" type="date" defaultValue={sp.dateFrom} />
          <Input name="dateTo" type="date" defaultValue={sp.dateTo} />
          <Button type="submit" size="sm">
            検索
          </Button>
        </form>
      </Card>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>帳票種別</Th>
              <Th>ファイル名</Th>
              <Th>出力日時</Th>
              <Th>出力者</Th>
              <Th>状態</Th>
            </tr>
          </Thead>
          <tbody>
            {logs.map((l) => (
              <Tr key={l.id}>
                <Td>{l.documentType}</Td>
                <Td>{l.fileName}</Td>
                <Td>{l.outputAt?.slice(0, 16).replace("T", " ")}</Td>
                <Td>{l.outputBy}</Td>
                <Td>
                  <StatusBadge status={l.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {logs.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-400">出力履歴がありません</p>}
      </Card>
    </div>
  );
}
