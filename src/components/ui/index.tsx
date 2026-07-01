import React from "react";
import clsx from "clsx";
import Link from "next/link";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-navy text-white hover:bg-navy-dark",
    secondary: "bg-white text-navy border border-navy/30 hover:bg-navy/5",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-gray-600 hover:bg-gray-100",
  };
  return <button className={clsx(base, sizes[size], variants[variant], className)} {...props} />;
}

export function LinkButton({
  href,
  className,
  variant = "primary",
  size = "md",
  children,
}: {
  href: string;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  children: React.ReactNode;
}) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors whitespace-nowrap";
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-navy text-white hover:bg-navy-dark",
    secondary: "bg-white text-navy border border-navy/30 hover:bg-navy/5",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-gray-600 hover:bg-gray-100",
  };
  return (
    <Link href={href} className={clsx(base, sizes[size], variants[variant], className)}>
      {children}
    </Link>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy bg-white",
        props.className
      )}
    />
  );
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("rounded-lg border border-gray-200 bg-white shadow-sm", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
      <div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  有効: "bg-green-100 text-green-700",
  無効: "bg-gray-100 text-gray-500",
  // 汎用ステータス色分け
  作成中: "bg-gray-100 text-gray-700",
  下書き: "bg-gray-100 text-gray-700",
  未請求: "bg-gray-100 text-gray-700",
  見積中: "bg-gray-100 text-gray-700",
  保留: "bg-yellow-100 text-yellow-800",
  提出済: "bg-blue-100 text-blue-700",
  発行済: "bg-blue-100 text-blue-700",
  請求書作成済: "bg-blue-100 text-blue-700",
  施工中: "bg-blue-100 text-blue-700",
  請求中: "bg-indigo-100 text-indigo-700",
  送付済: "bg-indigo-100 text-indigo-700",
  受注: "bg-green-100 text-green-700",
  完了: "bg-green-100 text-green-700",
  入金済: "bg-green-100 text-green-700",
  再発行済: "bg-purple-100 text-purple-700",
  失注: "bg-red-100 text-red-700",
  取消: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeColors[status] || "bg-gray-100 text-gray-700"
      )}
    >
      {status}
    </span>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-10 text-center text-sm text-gray-400">{children}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
