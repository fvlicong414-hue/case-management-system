"use server";

import { redirect } from "next/navigation";
import { getUserByEmail } from "../db/users";
import { verifyPassword, setSessionCookie, clearSessionCookie } from "../auth";
import { getStr } from "./util";

export async function loginAction(formData: FormData) {
  const email = getStr(formData, "email");
  const password = getStr(formData, "password");

  const user = await getUserByEmail(email);
  if (!user || !user.isActive) {
    redirect(`/login?error=${encodeURIComponent("メールアドレスまたはパスワードが正しくありません")}`);
  }
  const ok = await verifyPassword(password, user!.passwordHash);
  if (!ok) {
    redirect(`/login?error=${encodeURIComponent("メールアドレスまたはパスワードが正しくありません")}`);
  }
  await setSessionCookie({
    userId: user!.id,
    tenantId: user!.tenantId,
    name: user!.name,
    email: user!.email,
    role: user!.role,
  });
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
