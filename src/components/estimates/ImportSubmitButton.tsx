"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

/**
 * フォームのsubmitボタン専用。送信中(pending)は指定した文言に変わりボタンを
 * 無効化する。時間のかかる処理(Excel取り込みなど)で、押せているか分からない・
 * 連打で二重に実行してしまう、という問題への対応。
 */
export function ImportSubmitButton({
  idleLabel = "Excelから見積を作成して受注まで進める",
  pendingLabel = "取り込み中…(数分かかる場合があります)",
}: {
  idleLabel?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
