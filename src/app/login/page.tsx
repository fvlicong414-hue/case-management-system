import { loginAction } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlertBanner } from "@/components/ui/alert";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-navy text-lg font-bold text-white">
            F
          </div>
          <h1 className="text-lg font-bold text-gray-900">案件・見積・請求管理システム</h1>
          <p className="mt-1 text-xs text-gray-500">ローカルMVP版</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <AlertBanner error={error} />
          <form action={loginAction} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">メールアドレス</label>
              <input
                name="email"
                type="email"
                required
                defaultValue="admin@forval.local"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">パスワード</label>
              <input
                name="password"
                type="password"
                required
                defaultValue="password123"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
            >
              ログイン
            </button>
          </form>
        </div>
        <div className="mt-4 rounded-md bg-white/60 p-3 text-xs text-gray-500">
          <p className="mb-1 font-medium">初期アカウント(npm run db:seed で作成):</p>
          <p>forval_admin: admin@forval.local / password123</p>
          <p>customer_admin: customer-admin@forval.local / password123</p>
          <p>staff: staff@forval.local / password123</p>
        </div>
      </div>
    </div>
  );
}
