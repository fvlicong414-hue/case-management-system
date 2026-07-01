import { requireSession } from "@/lib/auth";
import { getSettings } from "@/lib/db/settings";
import { updateSettingsAction } from "@/lib/actions/settings";
import { Card, CardHeader, Field, Input, Textarea, Button, PageHeader } from "@/components/ui";
import { AlertBanner } from "@/components/ui/alert";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const session = await requireSession();
  const { error, success } = await searchParams;
  const settings = await getSettings(session.tenantId);

  return (
    <div>
      <PageHeader title="設定" />
      <AlertBanner error={error} success={success} />

      <Card>
        <CardHeader title="料率・採番設定" />
        <form action={updateSettingsAction} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field label="消費税率(%)" required>
            <Input name="taxRate" type="number" step="0.1" defaultValue={settings.taxRate * 100} required />
          </Field>
          <Field label="間接経費率(%)" required>
            <Input name="overheadRate" type="number" step="0.1" defaultValue={settings.overheadRate * 100} required />
          </Field>
          <Field label="見積番号プレフィックス">
            <Input name="estimateNumberPrefix" defaultValue={settings.estimateNumberPrefix} />
          </Field>
          <Field label="請求番号プレフィックス">
            <Input name="invoiceNumberPrefix" defaultValue={settings.invoiceNumberPrefix} />
          </Field>
          <Field label="案件番号プレフィックス">
            <Input name="projectNumberPrefix" defaultValue={settings.projectNumberPrefix} />
          </Field>

          <div className="sm:col-span-2 mt-2 border-t border-gray-100 pt-4">
            <p className="mb-3 text-xs font-semibold text-gray-500">自社情報(PDFに表示されます)</p>
          </div>
          <Field label="会社名">
            <Input name="companyName" defaultValue={settings.companyName ?? ""} />
          </Field>
          <Field label="電話番号">
            <Input name="companyPhone" defaultValue={settings.companyPhone ?? ""} />
          </Field>
          <Field label="郵便番号">
            <Input name="companyPostalCode" defaultValue={settings.companyPostalCode ?? ""} />
          </Field>
          <Field label="インボイス登録番号">
            <Input name="companyInvoiceRegistrationNumber" defaultValue={settings.companyInvoiceRegistrationNumber ?? ""} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="住所">
              <Input name="companyAddress" defaultValue={settings.companyAddress ?? ""} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="振込先情報">
              <Textarea name="bankInfo" rows={2} defaultValue={settings.bankInfo ?? ""} />
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
