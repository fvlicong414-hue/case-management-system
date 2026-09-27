import * as XLSX from "xlsx";

const ITEM_START_ROW = 21;
// 「合計」の行が見つからない壊れたファイルでも無限ループにならないための安全上限。
// 実運用でここまで大きな見積は想定していないが、上限自体は今後さらに増やせる。
const ITEM_ROW_SAFETY_LIMIT = 500;

export interface ParsedEstimateItem {
  itemName: string;
  quantity: number;
  unit?: string | null;
  salesUnitPrice: number;
}

export interface ParsedEstimate {
  title?: string | null;
  memo?: string | null;
  items: ParsedEstimateItem[];
}

function cellValue(sheet: XLSX.WorkSheet, addr: string): string | number | undefined {
  const cell = sheet[addr];
  return cell ? cell.v : undefined;
}
function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * 標準見積書フォーマット(修理/新規と同形式)のExcelから、工事名・明細・仕様条件を読み取る。
 * 明細1行目に「工事内容+品目名」をまとめて入力する運用(例:「SL300外倒し窓一箇所修繕」)にも
 * そのまま対応する(品目名として1つの文字列で読み取るだけのため、特別な処理は不要)。
 *
 * 明細の行数は固定せず、F列に「合計」という文字が現れる行の手前までを明細として読み取る。
 * これにより、Excel側で行を増やして品目を50件・100件と書いた場合でも、コードを変更せずに
 * そのまま対応できる(「合計」の行自体もその分下にずれるだけのため)。
 */
export function parseStandardEstimateExcel(buffer: Buffer, sheetName?: string): ParsedEstimate {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const targetSheetName = sheetName ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) throw new Error(`シート「${targetSheetName}」が見つかりません`);

  const title = cellValue(sheet, "B12");
  const items: ParsedEstimateItem[] = [];
  let totalRow: number | null = null;

  for (let row = ITEM_START_ROW; row < ITEM_START_ROW + ITEM_ROW_SAFETY_LIMIT; row++) {
    const totalMarker = cellValue(sheet, `F${row}`);
    if (typeof totalMarker === "string" && totalMarker.trim() === "合計") {
      totalRow = row;
      break;
    }

    const name = cellValue(sheet, `B${row}`);
    if (!isNonEmptyString(name)) continue;
    const quantity = cellValue(sheet, `F${row}`);
    const unit = cellValue(sheet, `G${row}`);
    const unitPrice = cellValue(sheet, `H${row}`);
    const amount = cellValue(sheet, `I${row}`);

    // 品名だけがあり、数量・単位・単価・金額のいずれも入っていない行は、
    // 明細行ではなく「見出し(グループ名)」の記載とみなしてスキップする。
    // (例:「ハンドルボックス・フェース・ワイヤー取替」のような、内訳の先頭に置かれる説明書き)
    const hasAnyValue = isNumber(quantity) || isNonEmptyString(unit) || isNumber(unitPrice) || isNumber(amount);
    if (!hasAnyValue) continue;

    const qty = isNumber(quantity) ? quantity : 1;

    // 単価欄(H列)が入っていればそれを使う。単価欄が空でも、内訳書を別途使う運用の
    // 見積書では金額欄(I列)に合計金額だけが入っていることがあるため、その場合は
    // 金額÷数量で単価を逆算する(金額の再現性を優先し、四捨五入等の誤差は生じさせない)。
    // 値引き行のようにマイナスの金額もそのまま扱う(0円だけを「未入力」とみなす)。
    let salesUnitPrice = 0;
    if (isNumber(unitPrice) && unitPrice !== 0) {
      salesUnitPrice = unitPrice;
    } else if (isNumber(amount) && amount !== 0 && qty !== 0) {
      salesUnitPrice = amount / qty;
    }

    items.push({
      itemName: name.trim(),
      quantity: qty,
      unit: isNonEmptyString(unit) ? unit.trim() : null,
      salesUnitPrice,
    });
  }

  // 仕様条件のメモは「合計」の行より下、数行以内に書かれている想定で、空でない行を拾う
  // (「合計」行が見つからなかった場合はメモの読み取りをスキップする)。
  const memoLines: string[] = [];
  if (totalRow !== null) {
    for (let r = totalRow + 1; r <= totalRow + 5; r++) {
      const v = cellValue(sheet, `A${r}`);
      if (isNonEmptyString(v)) memoLines.push(v.trim());
    }
  }

  return {
    title: isNonEmptyString(title) ? title.trim() : null,
    memo: memoLines.length > 0 ? memoLines.join("\n") : null,
    items,
  };
}

export function listSheetNames(buffer: Buffer): string[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return workbook.SheetNames;
}

export interface DetectedEstimateSheet {
  sheetName: string;
  parsed: ParsedEstimate;
}

/**
 * ワークブック内の全シートを順番に試し、実際に明細が読み取れた最初のシートを採用する。
 * 同じ様式の見本・空欄タブ(1枚目など)が混ざっていても、実際にデータが入っている
 * シートを自動的に見つけられるようにするため、シート名を人が手入力する必要をなくした。
 */
export function findBestEstimateSheet(buffer: Buffer): DetectedEstimateSheet {
  const names = listSheetNames(buffer);
  for (const name of names) {
    let parsed: ParsedEstimate;
    try {
      parsed = parseStandardEstimateExcel(buffer, name);
    } catch {
      continue;
    }
    if (parsed.items.length > 0) {
      return { sheetName: name, parsed };
    }
  }
  throw new Error("Excel内に、見積の明細(品名・数量・金額など)が入力されたシートが見つかりませんでした。");
}
