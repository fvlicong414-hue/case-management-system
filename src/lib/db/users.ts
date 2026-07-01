import { query, queryOne, generateId, nowIso } from "./client";
import type { User } from "./types";

const SELECT_COLS = `id, tenant_id as "tenantId", name, email, password_hash as "passwordHash",
  role, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`;

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return queryOne<User>(`SELECT ${SELECT_COLS} FROM users WHERE email = $1`, [email]);
}

export async function getUser(id: string): Promise<User | undefined> {
  return queryOne<User>(`SELECT ${SELECT_COLS} FROM users WHERE id = $1`, [id]);
}

export async function listUsers(tenantId: string): Promise<User[]> {
  return query<User>(`SELECT ${SELECT_COLS} FROM users WHERE tenant_id = $1 ORDER BY created_at ASC`, [tenantId]);
}

export async function createUser(input: {
  tenantId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: User["role"];
}): Promise<User> {
  const id = generateId();
  const now = nowIso();
  await query(
    `INSERT INTO users (id, tenant_id, name, email, password_hash, role, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)`,
    [id, input.tenantId, input.name, input.email, input.passwordHash, input.role, now, now]
  );
  return (await getUser(id))!;
}

export async function updateUser(
  id: string,
  input: Partial<{ name: string; role: User["role"]; isActive: boolean; passwordHash: string }>
): Promise<User> {
  const current = await getUser(id);
  if (!current) throw new Error("ユーザーが見つかりません");
  const now = nowIso();
  await query(
    `UPDATE users SET name = $1, role = $2, is_active = $3, password_hash = $4, updated_at = $5 WHERE id = $6`,
    [
      input.name ?? current.name,
      input.role ?? current.role,
      input.isActive ?? current.isActive,
      input.passwordHash ?? current.passwordHash,
      now,
      id,
    ]
  );
  return (await getUser(id))!;
}
