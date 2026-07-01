import { requireSession } from "@/lib/auth";
import { listCustomers } from "@/lib/db/customers";
import { PageHeader, LinkButton, Card, StatusBadge } from "@/components/ui";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { Input, Button } from "@/components/ui";
import Link from "next/link";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; billingName?: string; address?: string; contactPerson?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const customers = await listCustomers(session.tenantId, sp);

  return (
    <div>
      <PageHeader
        title="顧客管理"
        subtitle={`${customers.length}件`}
        actions={<LinkButton href="/customers/new">+ 新規顧客登録</LinkButton>}
      />

      <Card className="mb-4">
        <form className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <Input name="name" placeholder="顧客名" defaultValue={sp.name} />
          <Input name="billingName" placeholder="請求先名" defaultValue={sp.billingName} />
          <Input name="address" placeholder="住所" defaultValue={sp.address} />
          <Input name="contactPerson" placeholder="担当者" defaultValue={sp.contactPerson} />
          <div className="col-span-2 sm:col-span-4">
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
              <Th>顧客コード</Th>
              <Th>顧客名</Th>
              <Th>請求先名</Th>
              <Th>住所</Th>
              <Th>担当者</Th>
              <Th>締日</Th>
              <Th>支払条件</Th>
              <Th>状態</Th>
            </tr>
          </Thead>
          <tbody>
            {customers.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <Link href={`/customers/${c.id}`} className="text-navy hover:underline">
                    {c.customerCode}
                  </Link>
                </Td>
                <Td>{c.name}</Td>
                <Td>{c.billingName}</Td>
                <Td>{c.address}</Td>
                <Td>{c.contactPerson}</Td>
                <Td>{c.closingDay}</Td>
                <Td>{c.paymentTerms}</Td>
                <Td>
                  <StatusBadge status={c.isActive ? "有効" : "無効"} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {customers.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-400">該当する顧客がありません</p>}
      </Card>
    </div>
  );
}
