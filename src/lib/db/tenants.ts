import { query, queryOne, generateId, nowIso } from "./client";
import type { Tenant } from "./types";

export async function getTenant(id: string): Promise<Tenant | undefined> {
  return queryOne<Tenant>('SELECT * FROM tenants WHERE id = $1', [id]);
}

export async function listTenants(): Promise<Tenant[]> {
  return query<Tenant>('SELECT * FROM tenants ORDER BY created_at ASC');
}

export async function createTenant(name: string): Promise<Tenant> {
  const id = generateId();
  const now = nowIso();
  await query(
    `INSERT INTO tenants (id, name, plan, status, created_at, updated_at) VALUES ($1, $2, 'standard', 'active', $3, $4)`,
    [id, name, now, now]
  );
  return (await getTenant(id))!;
}

export async function getOrCreateDefaultTenant(): Promise<Tenant> {
  const existing = await listTenants();
  if (existing.length > 0) return existing[0];
  return createTenant("株式会社フォーバル");
}
