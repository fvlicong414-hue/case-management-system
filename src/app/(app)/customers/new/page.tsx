import { createCustomerAction } from "@/lib/actions/customers";
import { Card, CardHeader, Field, Input, Textarea, Button, PageHeader } from "@/components/ui";
import { AlertBanner } from "@/components/ui/alert";

export default async function NewCustomerPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div>
      <PageHeader title="新規顧客登録" />
      <AlertBanner error={error} />
      <Card>
        <CardHeader title="顧客情報" />
        <form action={createCustomerAction} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field label="顧客名" required>
            <Input name="name" required />
          </Field>
          <Field label="請求先名">
            <Input name="billingName" placeholder="「御中」は付けずに入力してください" />
          </Field>
          <Field label="郵便番号">
            <Input name="postalCode" placeholder="150-0036" />
          </Field>
          <Field label="住所">
            <Input name="address" />
          </Field>
          <Field label="電話番号">
            <Input name="phone" />
          </Field>
          <Field label="担当者">
            <Input name="contactPerson" />
          </Field>
          <Field label="締日">
            <Input name="closingDay" placeholder="末日" />
          </Field>
          <Field label="支払条件">
            <Input name="paymentTerms" placeholder="翌月末払い" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="備考">
              <Textarea name="memo" rows={3} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">保存</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
