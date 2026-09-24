import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/client";

/**
 * Supabase(無料プラン)は7日間データベースへのアクセスがないと
 * 自動的に一時停止してしまう。Vercelのcron機能を使い、毎日軽く
 * クエリを実行することで、この自動停止を回避する。
 *
 * vercel.json の crons 設定で、毎日1回このエンドポイントが自動的に呼ばれる。
 */
export async function GET(req: NextRequest) {
  // Vercelのcronは実行時にAuthorizationヘッダーを付与する。
  // CRON_SECRETを環境変数に設定している場合のみ、念のため検証する。
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const rows = await query<{ now: string }>("SELECT now() as now");
    return NextResponse.json({ ok: true, checkedAt: rows[0]?.now ?? null });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
