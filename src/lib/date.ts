/** 西暦の日付文字列(YYYY-MM-DD)を、令和の年・月・日に変換する(令和1年=2019年)。 */
export function toReiwa(dateStr: string): { year: number; month: number; day: number } {
  const d = new Date(dateStr);
  return { year: d.getFullYear() - 2018, month: d.getMonth() + 1, day: d.getDate() };
}

/** 「令和8年7月1日」のような表記の文字列を作る。 */
export function formatReiwaLong(dateStr?: string | null): string {
  if (!dateStr) return "";
  const { year, month, day } = toReiwa(dateStr);
  return `令和${year}年${month}月${day}日`;
}
