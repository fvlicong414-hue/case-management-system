/**
 * 開発用: すべてのテーブルを削除して作り直す(データも全て消えます)
 * 実行方法: npm run db:reset
 */
import { getPoolForReset } from "../src/lib/db/client";

const TABLES = [
  "document_logs",
  "invoice_items",
  "invoices",
  "billing_schedules",
  "specifications",
  "estimate_items",
  "estimates",
  "item_master",
  "projects",
  "customers",
  "document_formats",
  "settings",
  "users",
  "tenants",
];

async function main() {
  const pool = getPoolForReset();
  for (const t of TABLES) {
    await pool.query(`DROP TABLE IF EXISTS ${t} CASCADE`);
    console.log(`テーブル削除: ${t}`);
  }
  console.log("\n初期化が完了しました。続けて `npm run db:seed` を実行してください。");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
