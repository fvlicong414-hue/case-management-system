import { cookies } from "next/headers";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { type Role, type SessionUser, roleLabel } from "./roles";

export type { Role, SessionUser };
export { roleLabel };

const SESSION_COOKIE = "cms_session";
const SECRET = process.env.AUTH_SECRET || "local-dev-secret-change-me";

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createSessionToken(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

/** サーバーコンポーネント/サーバーアクションから現在のログインユーザーを取得する */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("ログインが必要です");
  }
  return session;
}

export async function setSessionCookie(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7日
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---------------------------------------------------------------------------
// 権限チェック
// ---------------------------------------------------------------------------

export const PERMISSIONS = {
  manageTenant: ["forval_admin"] as Role[],
  manageUsers: ["forval_admin", "customer_admin"] as Role[],
  editSettings: ["forval_admin", "customer_admin"] as Role[],
  cancelReissue: ["forval_admin", "customer_admin"] as Role[],
  exportCsv: ["forval_admin", "customer_admin"] as Role[],
  editMasters: ["forval_admin", "customer_admin"] as Role[], // 顧客/品目マスター編集
  viewAllTenants: ["forval_admin"] as Role[],
};

export function can(user: SessionUser | null, permission: keyof typeof PERMISSIONS): boolean {
  if (!user) return false;
  return PERMISSIONS[permission].includes(user.role);
}
