/**
 * 見積のシート名(例:「修理１」「修　理」)から、対になる「指示書」「手配書」の
 * シート名(例:「指示書1」「手配書1」)を自動で見つけるための仕組み。
 *
 * 実際の運用で使われているファイルでは、同じ工事番号の組でも
 * 全角数字(「修理１」)と半角数字(「指示書1」)が混在していることがあるため、
 * 単純な文字列一致では対応できない。そのため、Unicode正規化(NFKC)で
 * 全角/半角の違いを吸収したうえで、末尾の番号(なければ空)だけを比較する。
 */

function normalize(name: string): string {
  return name.normalize("NFKC");
}

/** シート名の末尾についている番号を取り出す(全角・半角どちらでも半角の文字列として返す)。無ければ空文字。 */
function suffixOf(name: string): string {
  const m = normalize(name).match(/(\d+)\s*$/);
  return m ? m[1] : "";
}

/**
 * 見積で採用したシート名(baseName)と同じ末尾番号を持つ、prefixで始まるシートを探す。
 * 見つからなければ、番号なしの同名シート(例:「指示書」)にフォールバックする。
 */
export function findPairedSheet(baseName: string, allSheetNames: string[], prefix: string): string | null {
  const suffix = suffixOf(baseName);
  const withSameSuffix = allSheetNames.find((n) => n.startsWith(prefix) && suffixOf(n) === suffix);
  if (withSameSuffix) return withSameSuffix;
  const plain = allSheetNames.find((n) => n === prefix);
  return plain ?? null;
}
