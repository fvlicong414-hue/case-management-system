/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 日本語フォント(PDF出力用)とExcelテンプレート(Excel出力用)は、
    // fs.readFileSyncで実行時に読み込む静的資産のため、
    // Vercelのサーバーレス関数バンドルに確実に含まれるようにする。
    // これを入れないと、ローカルでは動くのに本番(Vercel)でだけ
    // 「ファイルが見つからない」エラーになることがある。
    outputFileTracingIncludes: {
      "/api/pdf/estimate/[id]/route": ["./node_modules/@fontsource/noto-sans-jp/files/**"],
      "/api/pdf/invoice/[id]/route": ["./node_modules/@fontsource/noto-sans-jp/files/**"],
      "/api/pdf/specification/[id]/route": ["./node_modules/@fontsource/noto-sans-jp/files/**"],
      "/api/excel/estimate-package/[id]/route": ["./src/lib/export/templates/**"],
      "/api/excel/purchase-order/[id]/route": ["./src/lib/export/templates/**"],
    },
  },
};

export default nextConfig;
