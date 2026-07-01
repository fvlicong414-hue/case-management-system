import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { registerJapaneseFont } from "./font";

registerJapaneseFont();

const styles = StyleSheet.create({
  page: { fontFamily: "NotoSansJP", padding: 36, fontSize: 10, color: "#111827" },
  title: { fontSize: 20, textAlign: "center", marginBottom: 18, letterSpacing: 4 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2, width: 220 },
  section: { marginTop: 14, marginBottom: 6, fontSize: 11, borderBottomWidth: 2, borderBottomColor: "#1e3a5f", paddingBottom: 3 },
  block: { minHeight: 40, padding: 6, borderWidth: 0.5, borderColor: "#9ca3af" },
  footer: { position: "absolute", bottom: 30, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#4b5563", borderTopWidth: 0.5, borderTopColor: "#9ca3af", paddingTop: 6 },
});

export interface SpecificationPdfProps {
  estimateNo: string;
  createdDate: string;
  customerName: string;
  projectName: string;
  siteName?: string | null;
  constructionScope?: string | null;
  materials?: string | null;
  method?: string | null;
  notes?: string | null;
  warranty?: string | null;
  company: { name?: string | null; address?: string | null; phone?: string | null };
}

export function SpecificationPdfDocument(props: SpecificationPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>工 事 仕 様 書</Text>
        <View style={styles.headerRow}>
          <View>
            <Text>{props.customerName} 御中</Text>
            <Text style={{ marginTop: 4 }}>案件名: {props.projectName}</Text>
            {props.siteName ? <Text>現場名: {props.siteName}</Text> : null}
          </View>
          <View>
            <View style={styles.metaRow}>
              <Text>見積番号</Text>
              <Text>{props.estimateNo}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text>作成日</Text>
              <Text>{props.createdDate}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.section}>施工範囲</Text>
        <View style={styles.block}>
          <Text>{props.constructionScope || ""}</Text>
        </View>

        <Text style={styles.section}>使用材料</Text>
        <View style={styles.block}>
          <Text>{props.materials || ""}</Text>
        </View>

        <Text style={styles.section}>施工方法</Text>
        <View style={styles.block}>
          <Text>{props.method || ""}</Text>
        </View>

        <Text style={styles.section}>注意事項</Text>
        <View style={styles.block}>
          <Text>{props.notes || ""}</Text>
        </View>

        <Text style={styles.section}>保証・補足</Text>
        <View style={styles.block}>
          <Text>{props.warranty || ""}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>{props.company.name}</Text>
          <Text>
            {props.company.address}　TEL: {props.company.phone}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
