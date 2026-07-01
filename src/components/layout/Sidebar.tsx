"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { roleLabel, type SessionUser } from "@/lib/roles";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", label: "ダッシュボード", icon: "📊" },
  { href: "/customers", label: "顧客管理", icon: "🏢" },
  { href: "/projects", label: "案件管理", icon: "🏗️" },
  { href: "/items", label: "品目マスター", icon: "📦" },
  { href: "/estimates", label: "見積", icon: "📝" },
  { href: "/billing-schedules", label: "請求予定", icon: "📅" },
  { href: "/invoices/new", label: "月次請求作成", icon: "🧾" },
  { href: "/invoices", label: "請求書", icon: "💴" },
  { href: "/document-logs", label: "PDF出力履歴", icon: "📄" },
  { href: "/export", label: "CSVエクスポート", icon: "⬇️" },
  { href: "/settings", label: "設定", icon: "⚙️" },
];

export function Sidebar({ user }: { user: SessionUser }) {
  const currentPath = usePathname();
  return (
    <aside className="flex h-screen w-56 flex-shrink-0 flex-col border-r border-gray-200 bg-navy text-white">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-white/10 text-sm font-bold">F</div>
        <div>
          <p className="text-sm font-bold leading-tight">案件管理システム</p>
          <p className="text-[10px] text-white/60">ローカルMVP</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_ITEMS.map((item) => {
          const active = currentPath === item.href || currentPath.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "mx-2 mb-0.5 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-white/15 font-medium text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
              )}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-4 py-3">
        <p className="truncate text-xs font-medium text-white">{user.name}</p>
        <p className="truncate text-[11px] text-white/60">{roleLabel(user.role)}</p>
        <form action={logoutAction} className="mt-2">
          <button type="submit" className="text-[11px] text-white/60 underline hover:text-white">
            ログアウト
          </button>
        </form>
      </div>
    </aside>
  );
}
