import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { registerJapaneseFont } from "./font";
import { formatCurrency } from "../calc";

registerJapaneseFont();

const styles = StyleSheet.create({
  page: { fontFamily: "NotoSansJP", padding: 36, fontSize: 9.5, color: "#111827" },
  title: { fontSize: 20, textAlign: "center", marginBottom: 18, letterSpacing: 4 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  customerBlock: { width: "55%" },
  customerName: { fontSize: 13, borderBottomWidth: 1, borderBottomColor: "#111827", paddingBottom: 4, marginBottom: 6 },
  metaBlock: { width: "40%" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  totalBox: { borderWidth: 1, borderColor: "#111827", padding: 8, marginTop: 8 },
  totalLabel: { fontSize: 9, color: "#374151" },
  totalValue: { fontSize: 16, marginTop: 2 },
  section: { marginTop: 14, marginBottom: 6, fontSize: 11, borderBottomWidth: 2, borderBottomColor: "#1e3a5f", paddingBottom: 3 },
  table: { marginTop: 4 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#1e3a5f", paddingVertical: 5, paddingHorizontal: 4 },
  tableRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: "#d1d5db" },
  th: { color: "#ffffff", fontSize: 9 },
  colName: { width: "30%" },
  colSpec: { width: "22%" },
  colQty: { width: "10%", textAlign: "right" },
  colUnit: { width: "8%", textAlign: "center" },
  colPrice: { width: "15%", textAlign: "right" },
  colAmount: { width: "15%", textAlign: "right" },
  summaryBox: { marginTop: 10, alignItems: "flex-end" },
  summaryRow: { flexDirection: "row", width: 220, justifyContent: "space-between", paddingVertical: 2 },
  summaryRowBold: { flexDirection: "row", width: 220, justifyContent: "space-between", paddingVertical: 4, borderTopWidth: 1, borderTopColor: "#111827", marginTop: 2 },
  memoBox: { marginTop: 16, borderWidth: 0.5, borderColor: "#9ca3af", padding: 8, minHeight: 40 },
  footer: { position: "absolute", bottom: 30, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#4b5563", borderTopWidth: 0.5, borderTopColor: "#9ca3af", paddingTop: 6 },
});

export interface EstimatePdfProps {
  estimateNo: string;
  estimateDate: string;
  customerName: string;
  billingName?: string | null;
  projectName: string;
  siteName?: string | null;
  title?: string | null;
  items: { itemName: string; specification?: string | null; quantity: number; unit?: string | null; salesUnitPrice: number; salesAmount: number }[];
  salesTotal: number;
  taxAmount: number;
  totalWithTax: number;
  memo?: string | null;
  company: { name?: string | null; address?: string | null; phone?: string | null; invoiceRegistrationNumber?: string | null };
}

export function EstimatePdfDocument(props: EstimatePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>御 見 積 書</Text>

        <View style={styles.headerRow}>
          <View style={styles.customerBlock}>
            <Text style={styles.customerName}>{props.billingName || props.customerName} 御中</Text>
            <Text>件名: {props.title || props.projectName}</Text>
            <Text>案件名: {props.projectName}</Text>
            {props.siteName ? <Text>現場名: {props.siteName}</Text> : null}
          </View>
          <View style={styles.metaBlock}>
            <View style={styles.metaRow}>
              <Text>見積番号</Text>
              <Text>{props.estimateNo}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text>見積日</Text>
              <Text>{props.estimateDate}</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>ご請求金額(税込)</Text>
              <Text style={styles.totalValue}>{formatCurrency(props.totalWithTax)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.section}>明細</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colName]}>品目</Text>
            <Text style={[styles.th, styles.colSpec]}>仕様</Text>
            <Text style={[styles.th, styles.colQty]}>数量</Text>
            <Text style={[styles.th, styles.colUnit]}>単位</Text>
            <Text style={[styles.th, styles.colPrice]}>単価</Text>
            <Text style={[styles.th, styles.colAmount]}>金額</Text>
          </View>
          {props.items.map((item, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={styles.colName}>{item.itemName}</Text>
              <Text style={styles.colSpec}>{item.specification || ""}</Text>
              <Text style={styles.colQty}>{item.quantity.toLocaleString("ja-JP")}</Text>
              <Text style={styles.colUnit}>{item.unit || ""}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.salesUnitPrice)}</Text>
              <Text style={styles.colAmount}>{formatCurrency(item.salesAmount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>税抜合計</Text>
            <Text>{formatCurrency(props.salesTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>消費税</Text>
            <Text>{formatCurrency(props.taxAmount)}</Text>
          </View>
          <View style={styles.summaryRowBold}>
            <Text>税込合計</Text>
            <Text>{formatCurrency(props.totalWithTax)}</Text>
          </View>
        </View>

        <Text style={{ marginTop: 14, fontSize: 9 }}>備考</Text>
        <View style={styles.memoBox}>
          <Text>{props.memo || ""}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>{props.company.name}</Text>
          <Text>
            {props.company.address}　TEL: {props.company.phone}
            {props.company.invoiceRegistrationNumber ? `　登録番号: ${props.company.invoiceRegistrationNumber}` : ""}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
