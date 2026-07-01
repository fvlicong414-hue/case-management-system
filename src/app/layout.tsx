import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "案件・見積・請求管理システム",
  description: "建築業向け 案件・見積・仕様書・請求・粗利・入金管理システム(ローカルMVP)",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
