import { Font } from "@react-pdf/renderer";
import path from "node:path";

let registered = false;

/**
 * PDF生成の最初に1度だけ呼び出す。日本語(Noto Sans JP)フォントを登録する。
 *
 * フォントファイル(.woff)はこのフォルダ(src/lib/pdf/fonts/)に直接同梱している。
 * 以前はnode_modules内のファイルをfs.readFileSyncで実行時に読みに行く方式だったが、
 * Vercel(本番環境)ではサーバーレス関数に使用ファイルとして認識されず、
 * ビルドに含まれないことがあった。そのため、next.config.mjsの
 * outputFileTracingIncludesで、このフォルダを明示的にVercelへ
 * 同梱するよう指定している(このファイルとnext.config.mjsは対でセット)。
 */
export function registerJapaneseFont() {
  if (registered) return;
  const base = path.join(process.cwd(), "src/lib/pdf/fonts");
  Font.register({
    family: "NotoSansJP",
    fonts: [
      { src: path.join(base, "noto-sans-jp-400.woff"), fontWeight: "normal" },
      { src: path.join(base, "noto-sans-jp-700.woff"), fontWeight: "bold" },
    ],
  });
  // react-pdf は日本語のような分かち書きされない文字列を1単語として扱うと
  // 折り返しがおかしくなることがあるため、文字単位の折り返しを有効にする。
  Font.registerHyphenationCallback((word) => Array.from(word).flatMap((c) => [c, ""]));
  registered = true;
}
