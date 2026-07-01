import { Pool, types, type QueryResultRow } from "pg";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// pg はデフォルトで timestamp/timestamptz 型を JS の Date オブジェクトに変換するが、
// このアプリでは日時を一貫して ISO 文字列として扱っている(TEXT列の日付と同じ形式で
// 画面やPDFに表示するため)。そのため型パーサーを上書きし、文字列のまま返すようにする。
types.setTypeParser(1114, (v: string) => v); // timestamp without time zone
types.setTypeParser(1184, (v: string) => v); // timestamp with time zone (timestamptz)

declare global {
  // eslint-disable-next-line no-var
  var __pgPool__: Pool | undefined;
  // eslint-disable-next-line no-var
  var __schemaReady__: Promise<void> | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL が設定されていません。.env ファイルに Supabase (PostgreSQL) の接続文字列を設定してください。"
    );
  }
  // Supabase等のホスト型PostgreSQLはSSL接続が必要なことが多いため、
  // ローカル開発(localhost)以外では SSL を有効にする。
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  return new Pool({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 5,
  });
}

function getPool(): Pool {
  if (!global.__pgPool__) {
    global.__pgPool__ = createPool();
  }
  return global.__pgPool__;
}

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  const schemaSql = fs.readFileSync(path.join(process.cwd(), "db", "postgres.sql"), "utf-8");
  await pool.query(schemaSql);
}

function getSchemaReady(): Promise<void> {
  if (!global.__schemaReady__) {
    global.__schemaReady__ = ensureSchema();
  }
  return global.__schemaReady__;
}

export function getPoolForReset(): Pool {
  return getPool();
}

/**
 * SQL実行の共通ヘルパー。$1, $2, ... のプレースホルダを使う(Postgres形式)。
 * 初回呼び出し時にテーブルが存在しなければ自動作成する。
 */
export async function query<T extends QueryResultRow = any>(text: string, params: any[] = []): Promise<T[]> {
  await getSchemaReady();
  const pool = getPool();
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = any>(text: string, params: any[] = []): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

/** Prisma の cuid() に相当する ID 生成(将来の移行時も同じ形式のIDを維持) */
export function generateId(): string {
  return "c" + crypto.randomBytes(12).toString("hex");
}

export function nowIso(): string {
  return new Date().toISOString();
}
