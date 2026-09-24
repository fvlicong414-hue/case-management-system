import { getCustomer } from "@/lib/db/customers";
import { listProjects } from "@/lib/db/projects";
import { getCustomerMonthlySales } from "@/lib/db/reports";
import { updateCustomerAction, toggleCustomerActiveAction } from "@/lib/actions/customers";
import { Card, CardHeader, Field, Input, Textarea, Button, PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { formatCurrency } from "@/lib/calc";
import { AlertBanner } from "@/components/ui/alert";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, success } = await searchParams;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const projects = await listProjects(customer.tenantId, { customerId: id });
  const monthlySales = await getCustomerMonthlySales(customer.tenantId, id, 6);

  const boundUpdate = updateCustomerAction.bind(null, id);
  const boundToggle = toggleCustomerActiveAction.bind(null, id, !customer.isActive);

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={`顧客コード: ${customer.customerCode}`}
        actions={
          <>
            <StatusBadge status={customer.isActive ? "有効" : "無効"} />
            <form action={boundToggle}>
              <Button type="submit" variant={customer.isActive ? "danger" : "secondary"} size="sm">
                {customer.isActive ? "無効化する" : "有効化する"}
              </Button>
            </form>
          </>
        }
      />
      <AlertBanner error={error} success={success} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="顧客情報" />
          <form action={boundUpdate} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="顧客名" required>
              <Input name="name" defaultValue={customer.name} required />
            </Field>
            <Field label="請求先名">
              <Input name="billingName" defaultValue={customer.billingName ?? ""} />
            </Field>
            <Field label="郵便番号">
              <Input name="postalCode" defaultValue={customer.postalCode ?? ""} />
            </Field>
            <Field label="住所">
              <Input name="address" defaultValue={customer.address ?? ""} />
            </Field>
            <Field label="電話番号">
              <Input name="phone" defaultValue={customer.phone ?? ""} />
            </Field>
            <Field label="担当者">
              <Input name="contactPerson" defaultValue={customer.contactPerson ?? ""} />
            </Field>
            <Field label="締日">
              <Input name="closingDay" defaultValue={customer.closingDay ?? ""} />
            </Field>
            <Field label="支払条件">
              <Input name="paymentTerms" defaultValue={customer.paymentTerms ?? ""} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="備考">
                <Textarea name="memo" rows={3} defaultValue={customer.memo ?? ""} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">保存</Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="関連案件" subtitle={`${projects.length}件`} />
          {projects.length === 0 ? (
            <EmptyState>案件がまだありません</EmptyState>
          ) : (
            <div className="divide-y divide-gray-100">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="block px-4 py-3 hover:bg-gray-50"
                >
                  <p className="text-sm font-medium text-navy">{p.projectName}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    <span className="text-xs text-gray-400">{p.projectCode}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="月次売上履歴" subtitle="直近6か月の請求ベース売上(税抜、取消を除く)" />
        {monthlySales.every((m) => m.totalAmount === 0) ? (
          <EmptyState>まだ請求実績がありません</EmptyState>
        ) : (
          <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-6">
            {monthlySales.map((m) => (
              <div key={m.billingMonth} className="rounded-md bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">{m.billingMonth}</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">{formatCurrency(m.totalAmount)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
