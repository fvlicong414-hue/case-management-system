"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

/**
 * フォームのsubmitボタン専用。送信中(pending)は「取り込み中…」表示にしてボタンを
 * 無効化する。Excel取り込みは数分かかることがあり、押せているか分からない・
 * 連打で二重に取り込んでしまう、という問題への対応。
 */
export function ImportSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "取り込み中…(数分かかる場合があります)" : "Excelから見積を作成して受注まで進める"}
    </Button>
  );
}
