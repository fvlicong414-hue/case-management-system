import { Font } from "@react-pdf/renderer";
import path from "node:path";

let registered = false;

/** PDF生成の最初に1度だけ呼び出す。日本語(Noto Sans JP)フォントを登録する。 */
export function registerJapaneseFont() {
  if (registered) return;
  const base = path.join(process.cwd(), "node_modules/@fontsource/noto-sans-jp/files");
  Font.register({
    family: "NotoSansJP",
    fonts: [
      { src: path.join(base, "noto-sans-jp-japanese-400-normal.woff"), fontWeight: "normal" },
      { src: path.join(base, "noto-sans-jp-japanese-700-normal.woff"), fontWeight: "bold" },
    ],
  });
  // react-pdf は日本語のような分かち書きされない文字列を1単語として扱うと
  // 折り返しがおかしくなることがあるため、文字単位の折り返しを有効にする。
  Font.registerHyphenationCallback((word) => Array.from(word).flatMap((c) => [c, ""]));
  registered = true;
}
