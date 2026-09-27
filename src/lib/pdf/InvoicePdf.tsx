import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { registerJapaneseFont } from "./font";
import { formatCurrency } from "../calc";
import { formatReiwaLong, toReiwa } from "../date";

registerJapaneseFont();

const styles = StyleSheet.create({
  page: { fontFamily: "NotoSansJP", padding: 36, fontSize: 9.5, color: "#111827" },
  title: { fontSize: 20, textAlign: "center", marginBottom: 4, letterSpacing: 10 },
  issueDate: { textAlign: "right", fontSize: 9, marginBottom: 10 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  customerBlock: { width: "55%" },
  customerName: { fontSize: 13, borderBottomWidth: 1, borderBottomColor: "#111827", paddingBottom: 4, marginBottom: 6 },
  companyBlock: { width: "40%" },
  companyName: { fontSize: 11, marginBottom: 2 },
  intro: { fontSize: 8, color: "#374151", marginBottom: 12 },
  balanceStrip: { flexDirection: "row", borderWidth: 0.5, borderColor: "#9ca3af", marginBottom: 4 },
  balanceCell: { flex: 1, borderRightWidth: 0.5, borderRightColor: "#9ca3af", padding: 4 },
  balanceCellLast: { flex: 1, padding: 4 },
  balanceLabel: { fontSize: 7, color: "#374151", marginBottom: 2 },
  balanceValue: { fontSize: 10 },
  table: { marginTop: 14 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#1e3a5f", paddingVertical: 5, paddingHorizontal: 4 },
  tableRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: "#d1d5db" },
  th: { color: "#ffffff", fontSize: 9 },
  colDate: { width: "14%" },
  colSite: { width: "34%" },
  colQty: { width: "10%", textAlign: "right" },
  colUnit: { width: "10%", textAlign: "center" },
  colAmount: { width: "16%", textAlign: "right" },
  colTax: { width: "16%", textAlign: "right" },
  summaryBox: { marginTop: 10, alignItems: "flex-end" },
  summaryRow: { flexDirection: "row", width: 220, justifyContent: "space-between", paddingVertical: 2 },
  summaryRowBold: { flexDirection: "row", width: 220, justifyContent: "space-between", paddingVertical: 4, borderTopWidth: 1, borderTopColor: "#111827", marginTop: 2 },
  bankBox: { marginTop: 16, fontSize: 9, lineHeight: 1.6 },
});

export interface InvoicePdfProps {
  invoiceNo: string;
  invoiceDate: string;
  paymentDueDate?: string | null;
  customerName: string;
  billingName?: string | null;
  postalCode?: string | null;
  address?: string | null;
  items: { siteName?: string | null; billingType: string; amount: number; completedDate?: string | null }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  bankInfo?: string | null;
  company: { name?: string | null; address?: string | null; phone?: string | null; invoiceRegistrationNumber?: string | null };
}

function formatDeliveryDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const { year, month, day } = toReiwa(dateStr);
  return `R${year}.${month}.${day}`;
}

export function InvoicePdfDocument(props: InvoicePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>御　　請　　求　　書</Text>
        <Text style={styles.issueDate}>{formatReiwaLong(props.invoiceDate)}</Text>

        <View style={styles.headerRow}>
          <View style={styles.customerBlock}>
            <Text style={styles.customerName}>{props.billingName || props.customerName} 御中</Text>
            {props.postalCode ? <Text>〒{props.postalCode}</Text> : null}
            {props.address ? <Text>{props.address}</Text> : null}
          </View>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{props.company.name}</Text>
            <Text>{props.company.address}</Text>
            {props.company.phone ? <Text>ＴＥＬ　{props.company.phone}</Text> : null}
            {props.company.invoiceRegistrationNumber ? <Text>登録番号　{props.company.invoiceRegistrationNumber}</Text> : null}
          </View>
        </View>

        <Text style={styles.intro}>下記の通りご請求申し上げます。</Text>

        <View style={styles.balanceStrip}>
          <View style={styles.balanceCell}>
            <Text style={styles.balanceLabel}>先月残高</Text>
            <Text style={styles.balanceValue}> </Text>
          </View>
          <View style={styles.balanceCell}>
            <Text style={styles.balanceLabel}>当月入金額</Text>
            <Text style={styles.balanceValue}> </Text>
          </View>
          <View style={styles.balanceCell}>
            <Text style={styles.balanceLabel}>繰越残高</Text>
            <Text style={styles.balanceValue}> </Text>
          </View>
          <View style={styles.balanceCell}>
            <Text style={styles.balanceLabel}>当月ご請求金額</Text>
            <Text style={styles.balanceValue}>￥{formatCurrency(props.totalAmount)}</Text>
          </View>
          <View style={styles.balanceCellLast}>
            <Text style={styles.balanceLabel}>差引合計金額</Text>
            <Text style={styles.balanceValue}>￥{formatCurrency(props.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colDate]}>納品月日</Text>
            <Text style={[styles.th, styles.colSite]}>工　事　名</Text>
            <Text style={[styles.th, styles.colQty]}>数量</Text>
            <Text style={[styles.th, styles.colUnit]}>単位</Text>
            <Text style={[styles.th, styles.colAmount]}>合計</Text>
            <Text style={[styles.th, styles.colTax]}>請求金額</Text>
          </View>
          {props.items.map((item, idx) => {
            const lineTax = Math.round(item.amount * 0.1);
            return (
              <View style={styles.tableRow} key={idx}>
                <Text style={styles.colDate}>{formatDeliveryDate(item.completedDate)}</Text>
                <Text style={styles.colSite}>{item.siteName || ""}</Text>
                <Text style={styles.colQty}>1</Text>
                <Text style={styles.colUnit}>式</Text>
                <Text style={styles.colAmount}>{formatCurrency(item.amount)}</Text>
                <Text style={styles.colTax}>{formatCurrency(item.amount + lineTax)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>消費税率</Text>
            <Text>10%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>対象小計</Text>
            <Text>{formatCurrency(props.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>消費税額</Text>
            <Text>{formatCurrency(props.taxAmount)}</Text>
          </View>
          <View style={styles.summaryRowBold}>
            <Text>合計</Text>
            <Text>{formatCurrency(props.totalAmount)}</Text>
          </View>
        </View>

        {props.bankInfo ? (
          <View style={styles.bankBox}>
            <Text>お振込みは下記銀行へお願い申しあげます。</Text>
            <Text>{props.bankInfo}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
