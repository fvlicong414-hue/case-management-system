import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { registerJapaneseFont } from "./font";
import { formatCurrency } from "../calc";
import { formatReiwaLong } from "../date";

registerJapaneseFont();

const styles = StyleSheet.create({
  page: { fontFamily: "NotoSansJP", padding: 36, fontSize: 9.5, color: "#111827" },
  title: { fontSize: 20, textAlign: "center", marginBottom: 4, letterSpacing: 10 },
  issueDate: { textAlign: "right", fontSize: 9, marginBottom: 10 },
  intro: { fontSize: 8, color: "#374151", marginBottom: 14, lineHeight: 1.4 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  customerBlock: { width: "55%" },
  customerName: { fontSize: 13, borderBottomWidth: 1, borderBottomColor: "#111827", paddingBottom: 4, marginBottom: 8 },
  companyBlock: { width: "40%" },
  companyName: { fontSize: 11, marginBottom: 2 },
  metaTable: { marginBottom: 10 },
  metaRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#d1d5db", paddingVertical: 3 },
  metaLabel: { width: 90, color: "#374151" },
  metaValue: { flex: 1 },
  netBox: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginBottom: 10 },
  netLabel: { fontSize: 9, color: "#374151", marginRight: 8 },
  netValue: { fontSize: 16 },
  table: { marginTop: 4 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#1e3a5f", paddingVertical: 5, paddingHorizontal: 4 },
  tableRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: "#d1d5db" },
  th: { color: "#ffffff", fontSize: 9 },
  colNo: { width: "8%" },
  colName: { width: "42%" },
  colQty: { width: "10%", textAlign: "right" },
  colUnit: { width: "10%", textAlign: "center" },
  colPrice: { width: "15%", textAlign: "right" },
  colAmount: { width: "15%", textAlign: "right" },
  summaryBox: { marginTop: 10, alignItems: "flex-end" },
  summaryRow: { flexDirection: "row", width: 220, justifyContent: "space-between", paddingVertical: 2 },
  summaryRowBold: { flexDirection: "row", width: 220, justifyContent: "space-between", paddingVertical: 4, borderTopWidth: 1, borderTopColor: "#111827", marginTop: 2 },
  memoText: { marginTop: 16, fontSize: 8, color: "#374151", lineHeight: 1.5 },
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
        <Text style={styles.title}>御　　見　　積　　書</Text>
        <Text style={styles.issueDate}>{formatReiwaLong(props.estimateDate)}</Text>
        <Text style={styles.intro}>
          下記の通りお見積り申し上げます。{"\n"}
          本見積り金額には消費税は含まれておりませんので、ご契約に際しては、消費税を別途計上願います。
        </Text>

        <View style={styles.headerRow}>
          <View style={styles.customerBlock}>
            <Text style={styles.customerName}>{props.billingName || props.customerName} 御中</Text>
          </View>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{props.company.name}</Text>
            <Text>{props.company.address}</Text>
            {props.company.phone ? <Text>ＴＥＬ　{props.company.phone}</Text> : null}
            {props.company.invoiceRegistrationNumber ? <Text>登録番号　{props.company.invoiceRegistrationNumber}</Text> : null}
          </View>
        </View>

        <View style={styles.metaTable}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>工事名</Text>
            <Text style={styles.metaValue}>{props.title || props.siteName || props.projectName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>取引条件</Text>
            <Text style={styles.metaValue}>従来通り</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>有効期間</Text>
            <Text style={styles.metaValue}>９０日間</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>納入場所</Text>
            <Text style={styles.metaValue}>現場取付渡し</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>納期</Text>
            <Text style={styles.metaValue}>お打ち合わせ</Text>
          </View>
        </View>

        <View style={styles.netBox}>
          <Text style={styles.netLabel}>見積金額(税抜) NET</Text>
          <Text style={styles.netValue}>{formatCurrency(props.salesTotal)}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colNo]}>№</Text>
            <Text style={[styles.th, styles.colName]}>名　称</Text>
            <Text style={[styles.th, styles.colQty]}>数量</Text>
            <Text style={[styles.th, styles.colUnit]}>単位</Text>
            <Text style={[styles.th, styles.colPrice]}>単　価</Text>
            <Text style={[styles.th, styles.colAmount]}>金額</Text>
          </View>
          {props.items.map((item, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={styles.colNo}>{idx + 1}</Text>
              <Text style={styles.colName}>{item.itemName}</Text>
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

        {props.memo ? <Text style={styles.memoText}>{props.memo}</Text> : null}
      </Page>
    </Document>
  );
}
