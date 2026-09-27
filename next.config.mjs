/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 日本語フォント(PDF出力用)は、以前はfs.readFileSyncで実行時に読み込む方式で、
    // ここでVercelへの明示的な同梱指定をしていたが、本番環境で依然として
    // 反映されない問題があったため、フォント自体をコードに直接埋め込む方式に変更した
    // (src/lib/pdf/font.ts 参照)。そのためフォント分の指定はここでは不要になった。
    // Excelテンプレート(Excel出力用)は引き続きファイル読み込み方式のため、
    // Vercelのサーバーレス関数バンドルに確実に含まれるようにする。
    outputFileTracingIncludes: {
      "/api/excel/estimate-package/[id]/route": ["./src/lib/export/templates/**"],
      "/api/excel/purchase-order/[id]/route": ["./src/lib/export/templates/**"],
    },
  },
};

export default nextConfig;
