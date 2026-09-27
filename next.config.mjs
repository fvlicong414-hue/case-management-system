/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 日本語フォント(PDF出力用、src/lib/pdf/fonts/内)とExcelテンプレート(Excel出力用)は、
    // fs.readFileSyncで実行時に読み込む静的資産のため、
    // Vercelのサーバーレス関数バンドルに確実に含まれるようにする。
    // これを入れないと、ローカルでは動くのに本番(Vercel)でだけ
    // 「ファイルが見つからない」エラーになることがある。
    outputFileTracingIncludes: {
      "/api/pdf/estimate/[id]/route": ["./src/lib/pdf/fonts/**"],
      "/api/pdf/invoice/[id]/route": ["./src/lib/pdf/fonts/**"],
      "/api/pdf/specification/[id]/route": ["./src/lib/pdf/fonts/**"],
      "/api/excel/estimate-package/[id]/route": ["./src/lib/export/templates/**"],
      "/api/excel/purchase-order/[id]/route": ["./src/lib/export/templates/**"],
    },
  },
};

export default nextConfig;
