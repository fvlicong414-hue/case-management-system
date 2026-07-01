/**
 * 仕様書の計算式をそのまま実装した共通計算ロジック。
 * 見積・請求書の両方から利用する。
 */

export interface LineTotals {
  salesAmount: number;
  costAmount: number;
  grossProfit: number;
}

export function calcLine(quantity: number, salesUnitPrice: number, costUnitPrice: number): LineTotals {
  const salesAmount = round2(quantity * salesUnitPrice);
  const costAmount = round2(quantity * costUnitPrice);
  const grossProfit = round2(salesAmount - costAmount);
  return { salesAmount, costAmount, grossProfit };
}

export interface EstimateTotals {
  salesTotal: number;
  costTotal: number;
  grossProfit: number;
  grossProfitRate: number;
  overheadRate: number;
  overheadAmount: number;
  operatingProfit: number;
  taxAmount: number;
  totalWithTax: number;
}

export function calcEstimateTotals(
  items: { salesAmount: number; costAmount: number }[],
  overheadRate: number,
  taxRate: number
): EstimateTotals {
  const salesTotal = round2(items.reduce((s, i) => s + i.salesAmount, 0));
  const costTotal = round2(items.reduce((s, i) => s + i.costAmount, 0));
  const grossProfit = round2(salesTotal - costTotal);
  const grossProfitRate = salesTotal > 0 ? round4(grossProfit / salesTotal) : 0;
  const overheadAmount = round2(salesTotal * overheadRate);
  const operatingProfit = round2(grossProfit - overheadAmount);
  const taxAmount = round2(salesTotal * taxRate);
  const totalWithTax = round2(salesTotal + taxAmount);
  return {
    salesTotal,
    costTotal,
    grossProfit,
    grossProfitRate,
    overheadRate,
    overheadAmount,
    operatingProfit,
    taxAmount,
    totalWithTax,
  };
}

export interface InvoiceTotals {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  costTotal: number;
  grossProfit: number;
  overheadAmount: number;
  operatingProfit: number;
}

export function calcInvoiceTotals(
  scheduledAmounts: number[],
  costAllocated: number[],
  overheadRate: number,
  taxRate: number
): InvoiceTotals {
  const subtotal = round2(scheduledAmounts.reduce((s, v) => s + v, 0));
  const costTotal = round2(costAllocated.reduce((s, v) => s + v, 0));
  const taxAmount = round2(subtotal * taxRate);
  const totalAmount = round2(subtotal + taxAmount);
  const grossProfit = round2(subtotal - costTotal);
  const overheadAmount = round2(subtotal * overheadRate);
  const operatingProfit = round2(grossProfit - overheadAmount);
  return { subtotal, taxAmount, totalAmount, costTotal, grossProfit, overheadAmount, operatingProfit };
}

/** 請求予定の原価按分(請求予定額の比率で見積原価を按分する) */
export function allocateCost(scheduledAmounts: number[], totalCost: number): number[] {
  const total = scheduledAmounts.reduce((s, v) => s + v, 0);
  if (total <= 0) return scheduledAmounts.map(() => 0);
  return scheduledAmounts.map((amt) => round2((amt / total) * totalCost));
}

export function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}
export function round4(v: number): number {
  return Math.round((v + Number.EPSILON) * 10000) / 10000;
}

export function formatCurrency(v: number): string {
  return "¥" + Math.round(v).toLocaleString("ja-JP");
}

export function formatPercent(v: number): string {
  return (v * 100).toFixed(1) + "%";
}
