import { importItemMasterAction } from "@/lib/actions/items";
import { Card, CardHeader, Field, Input, Button, PageHeader } from "@/components/ui";
import { AlertBanner } from "@/components/ui/alert";

export default async function ImportItemMasterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div>
      <PageHeader title="品目マスター Excel一括取り込み" />
      <AlertBanner error={error} />
      <Card>
        <CardHeader
          title="見積書Excelから品目・単価を取り込む"
          subtitle="標準見積書フォーマット(修理・新規と同形式)の右側に埋め込まれた品目コード・品名・得意先別単価の一覧表を読み取り、品目マスターへ登録します"
        />
        <form action={importItemMasterAction} className="grid grid-cols-1 gap-4 p-5">
          <Field label="Excelファイル(.xlsx)" required>
            <Input name="file" type="file" accept=".xlsx" required />
          </Field>
          <Field label="シート名(空欄の場合は1枚目のシートを使用)">
            <Input name="sheetName" placeholder="例: 修　理" />
          </Field>
          <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">
            <p className="mb-1 font-medium">取り込みルール</p>
            <ul className="list-inside list-disc space-y-0.5">
              <li>品目コードが既に登録済みの場合、価格帯(得意先別単価)のみ更新し、標準単価は変更しません</li>
              <li>新規の品目コードの場合、品目マスターを新規作成し、A区分の単価(なければ最初に見つかった単価)を標準売上単価とします</li>
              <li>単価が入っていない参照用の一覧(見積書欄側のコピー用リスト)は自動的に無視されます</li>
            </ul>
          </div>
          <div>
            <Button type="submit">取り込み実行</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
