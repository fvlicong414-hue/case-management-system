"use server";

import { requireSession, can } from "@/lib/auth";
import { query } from "@/lib/db/client";
import { errorRedirect, successRedirect, getStr } from "./util";

// テストデータの全削除で対象にするテーブル(子→親の順で削除しないと外部キー制約に
// 引っかかるため、この順番を守る)。tenants・users・settings・document_formats は
// アカウント自体やログイン設定なので削除対象に含めない(これらを消すとログインできなく
// なってしまうため)。
const TABLES_TO_CLEAR = [
  "document_logs",
  "invoice_items",
  "invoices",
  "billing_schedules",
  "specifications",
  "estimate_items",
  "estimates",
  "purchase_order_items",
  "purchase_orders",
  "item_price_tiers",
  "item_master",
  "projects",
  "customers",
];

/**
 * お客様へ本番として引き渡す前に、それまでのテスト用データ(顧客・案件・見積・
 * 請求書など)をすべて削除し、まっさらな状態に戻す。フォーバル管理者のみ実行可能。
 * ログインアカウント・設定・書式マスターは削除しない(引き続き使えるようにするため)。
 */
export async function resetAllTestDataAction(formData: FormData) {
  const session = await requireSession();
  if (!can(session, "manageTenant")) {
    errorRedirect("/settings", new Error("この操作はフォーバル管理者のみ実行できます"));
  }
  const confirmText = getStr(formData, "confirmText");
  if (confirmText !== "初期化する") {
    errorRedirect("/settings", new Error("確認用の文字列が一致しません。「初期化する」と正確に入力してください"));
  }
  try {
    for (const table of TABLES_TO_CLEAR) {
      await query(`DELETE FROM ${table} WHERE tenant_id = $1`, [session.tenantId]);
    }
    successRedirect("/settings", "テストデータをすべて初期化しました");
  } catch (e) {
    errorRedirect("/settings", e);
  }
}
