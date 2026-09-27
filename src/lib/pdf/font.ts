import { Font } from "@react-pdf/renderer";
import { NOTO_SANS_JP_400_BASE64 } from "./fonts/notoSansJp400";
import { NOTO_SANS_JP_700_BASE64 } from "./fonts/notoSansJp700";

let registered = false;

/**
 * PDF生成の最初に1度だけ呼び出す。日本語(Noto Sans JP)フォントを登録する。
 *
 * 以前はファイルパス(node_modules内のwoffファイル)を実行時に読みに行く方式だった。
 * この方式はローカルでは動くが、Vercel(本番環境)ではサーバーレス関数に
 * 使用ファイルとして認識されず、ビルドに含まれないことがあり、これが
 * 本番環境でのみPDF出力が失敗する原因になっていた。
 *
 * 対策として、フォントデータをコードの中に直接(base64のデータURLとして)
 * 埋め込む方式に変更した。ファイルシステムへの依存が一切なくなるため、
 * ローカルでも本番環境でも同じように確実に動作する。
 */
export function registerJapaneseFont() {
  if (registered) return;
  Font.register({
    family: "NotoSansJP",
    fonts: [
      { src: `data:font/woff;base64,${NOTO_SANS_JP_400_BASE64}`, fontWeight: "normal" },
      { src: `data:font/woff;base64,${NOTO_SANS_JP_700_BASE64}`, fontWeight: "bold" },
    ],
  });
  // react-pdf は日本語のような分かち書きされない文字列を1単語として扱うと
  // 折り返しがおかしくなることがあるため、文字単位の折り返しを有効にする。
  Font.registerHyphenationCallback((word) => Array.from(word).flatMap((c) => [c, ""]));
  registered = true;
}
