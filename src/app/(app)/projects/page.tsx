import { requireSession } from "@/lib/auth";
import { listProjects } from "@/lib/db/projects";
import { PageHeader, LinkButton, Card, StatusBadge, Input, Select, Button } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import Link from "next/link";

const STATUS_OPTIONS = ["見積中", "受注", "施工中", "完了", "請求中", "入金済", "失注", "保留", "取消"];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectName?: string; siteName?: string; customerName?: string; workCategory?: string; status?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const projects = await listProjects(session.tenantId, sp);

  return (
    <div>
      <PageHeader
        title="案件管理"
        subtitle={`${projects.length}件`}
        actions={<LinkButton href="/projects/new">+ 新規案件登録</LinkButton>}
      />

      <Card className="mb-4">
        <form className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-5">
          <Input name="projectName" placeholder="案件名" defaultValue={sp.projectName} />
          <Input name="siteName" placeholder="現場名" defaultValue={sp.siteName} />
          <Input name="customerName" placeholder="顧客名" defaultValue={sp.customerName} />
          <Input name="workCategory" placeholder="工事区分" defaultValue={sp.workCategory} />
          <Select name="status" defaultValue={sp.status ?? ""}>
            <option value="">すべてのステータス</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <div className="col-span-2 sm:col-span-5">
            <Button type="submit" size="sm">
              検索
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>案件番号</Th>
              <Th>案件名</Th>
              <Th>現場名</Th>
              <Th>顧客名</Th>
              <Th>工事区分</Th>
              <Th>ステータス</Th>
              <Th>完了予定日</Th>
            </tr>
          </Thead>
          <tbody>
            {projects.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <Link href={`/projects/${p.id}`} className="text-navy hover:underline">
                    {p.projectCode}
                  </Link>
                </Td>
                <Td>{p.projectName}</Td>
                <Td>{p.siteName}</Td>
                <Td>{p.customerName}</Td>
                <Td>{p.workCategory}</Td>
                <Td>
                  <StatusBadge status={p.status} />
                </Td>
                <Td>{p.completionPlanDate}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {projects.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-400">該当する案件がありません</p>}
      </Card>
    </div>
  );
}
