export function toCsv(headers: { key: string; label: string }[], rows: Record<string, any>[]): string {
  const escape = (v: any): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes("\n") || s.includes('"')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const headerLine = headers.map((h) => escape(h.label)).join(",");
  const lines = rows.map((row) => headers.map((h) => escape(row[h.key])).join(","));
  return [headerLine, ...lines].join("\r\n");
}

/** ExcelでBOM付きUTF-8として正しく開けるようにする */
export function csvResponse(csv: string, filename: string): Response {
  const bom = "\uFEFF";
  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
