import { requireSession } from "@/lib/auth";
import { listProjects } from "@/lib/db/projects";
import { PageHeader, LinkButton, Card, StatusBadge, Input, Select, Button } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import Link from "next/link";

const STATUS_OPTIONS = ["見積中", "受注", "施工中", "完了", "請求中", "入金済", "失注", "保留", "取消"];

function periodPresetHref(base: URLSearchParams, from: string, to: string): string {
  const params = new URLSearchParams(base);
  params.set("dateFrom", from);
  params.set("dateTo", to);
  return `/projects?${params.toString()}`;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    projectCode?: string;
    projectName?: string;
    siteName?: string;
    customerName?: string;
    workCategory?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const projects = await listProjects(session.tenantId, sp);

  const now = new Date();
  const year = now.getFullYear();
  const baseParams = new URLSearchParams();
  if (sp.projectCode) baseParams.set("projectCode", sp.projectCode);
  if (sp.projectName) baseParams.set("projectName", sp.projectName);
  if (sp.siteName) baseParams.set("siteName", sp.siteName);
  if (sp.customerName) baseParams.set("customerName", sp.customerName);
  if (sp.workCategory) baseParams.set("workCategory", sp.workCategory);
  if (sp.status) baseParams.set("status", sp.status);

  const presets = [
    { label: `${year}年(今年)`, from: `${year}-01-01`, to: `${year}-12-31` },
    { label: `${year - 1}年(昨年)`, from: `${year - 1}-01-01`, to: `${year - 1}-12-31` },
    { label: `${year}年 上半期`, from: `${year}-01-01`, to: `${year}-06-30` },
    { label: `${year}年 下半期`, from: `${year}-07-01`, to: `${year}-12-31` },
  ];

  return (
    <div>
      <PageHeader
        title="案件管理"
        subtitle={`${projects.length}件`}
        actions={<LinkButton href="/projects/new">+ 新規案件登録</LinkButton>}
      />

      <Card className="mb-4">
        <form className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <Input name="projectCode" placeholder="案件番号" defaultValue={sp.projectCode} />
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
          <div className="flex items-center gap-2">
            <Input name="dateFrom" type="date" defaultValue={sp.dateFrom} />
            <span className="text-xs text-gray-400">〜</span>
            <Input name="dateTo" type="date" defaultValue={sp.dateTo} />
          </div>
          <div className="flex items-end">
            <Button type="submit" size="sm">
              検索
            </Button>
          </div>
          <div className="col-span-2 flex flex-wrap items-center gap-1.5 sm:col-span-4">
            <span className="text-xs text-gray-400">期間の候補(着工予定日基準):</span>
            {presets.map((preset) => (
              <a
                key={preset.label}
                href={periodPresetHref(baseParams, preset.from, preset.to)}
                className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:border-navy hover:text-navy"
              >
                {preset.label}
              </a>
            ))}
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
              <Th>着工予定日</Th>
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
                <Td>{p.startPlanDate}</Td>
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
