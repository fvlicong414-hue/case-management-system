"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";
import { requireSession } from "@/lib/auth";
import { getProject, updateProject, updateProjectStatus } from "@/lib/db/projects";
import { createEstimate, addEstimateItem, submitEstimate, markEstimateOrdered } from "@/lib/db/estimates";
import { autoCreateBillingSchedulesForProject } from "@/lib/db/billingSchedules";
import { findBestEstimateSheet } from "@/lib/import/estimateExcelParser";
import { findPairedSheet } from "@/lib/import/sheetMatch";
import { parseInstructionSheet } from "@/lib/import/instructionSheetParser";
import { parseArrangementSheet } from "@/lib/import/arrangementSheetParser";
import { getStr, errorRedirect } from "./util";

/**
 * 「見積り読み取り」アクション。手入力での見積作成は行わず、Excel1つの取り込みだけで
 * 以下をまとめて実行する(案件詳細画面の1つのボタンに集約するための処理):
 *  1. 明細が入っているシートを自動で見つけて見積を作成し、提出済→受注まで進める
 *  2. 対になる「指示書」シートがあれば、得意先名・担当者・工事先住所・詳しい工事名(現場名)を
 *     案件情報に反映する(すでに入力されている項目は上書きしない)
 *  3. 対になる「手配書」シートがあれば、品番・品名の一覧を案件の備考欄に追記する
 *     (このシートの単価はメーカー価格表とのVLOOKUPが壊れていることがあるため読み取らない)
 *  4. 案件のステータスを「完了」にし、見積金額をもとに請求予定(区分:完了金)を自動作成する
 */
export async function importEstimateAndCompleteProjectAction(formData: FormData) {
  const session = await requireSession();
  const projectId = getStr(formData, "projectId");
  try {
    const project = await getProject(projectId);
    if (!project) throw new Error("案件が見つかりません");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Excelファイルを選択してください");
    }
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. 明細を自動検出して見積を作成
    const { sheetName, parsed } = findBestEstimateSheet(buffer);
    const estimate = await createEstimate(session.tenantId, {
      projectId,
      customerId: project.customerId,
      estimateDate: getStr(formData, "estimateDate") || new Date().toISOString().slice(0, 10),
      title: parsed.title ?? undefined,
      memo: parsed.memo ?? undefined,
      createdBy: session.name,
    });
    for (const item of parsed.items) {
      await addEstimateItem(estimate.id, {
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        salesUnitPrice: item.salesUnitPrice,
        costUnitPrice: 0,
      });
    }
    await submitEstimate(estimate.id);
    await markEstimateOrdered(estimate.id);

    // 2・3. 指示書・手配書があれば読み取って案件情報に反映
    const allSheetNames = XLSX.read(buffer, { type: "buffer" }).SheetNames;
    const instructionSheetName = findPairedSheet(sheetName, allSheetNames, "指示書");
    const arrangementSheetName = findPairedSheet(sheetName, allSheetNames, "手配書");

    const projectUpdate: { siteName?: string; siteAddress?: string; customerContact?: string; memo?: string } = {};

    if (instructionSheetName) {
      const info = parseInstructionSheet(buffer, instructionSheetName);
      if (info) {
        // 既に入力されている項目は上書きしない(現場で手入力済みの内容を優先する)
        if (!project.siteName && info.siteName) projectUpdate.siteName = info.siteName;
        if (!project.siteAddress && info.siteAddress) projectUpdate.siteAddress = info.siteAddress;
        if (!project.customerContact && info.customerContact) projectUpdate.customerContact = info.customerContact;
      }
    }

    if (arrangementSheetName) {
      const arrangementItems = parseArrangementSheet(buffer, arrangementSheetName);
      if (arrangementItems.length > 0) {
        const lines = arrangementItems.map((i) => (i.itemName ? `${i.itemCode}: ${i.itemName}` : i.itemCode));
        const infoNote = `【手配リスト(自動取込)】\n${lines.join("\n")}`;
        projectUpdate.memo = [project.memo, infoNote].filter(Boolean).join("\n\n");
      }
    }

    if (Object.keys(projectUpdate).length > 0) {
      await updateProject(projectId, projectUpdate);
    }

    // 4. 案件を完了にし、請求予定を自動作成
    await updateProjectStatus(projectId, "完了");
    const billingResult = await autoCreateBillingSchedulesForProject(session.tenantId, projectId);

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    let message = `Excelから見積を読み取り、案件を完了にしました(明細${parsed.items.length}件)。`;
    if (billingResult.createdCount > 0) {
      message += `請求予定(完了金)を自動作成しました。`;
    }
    message += "原価単価は0円で登録されているため、必要に応じて見積詳細から確認・修正してください。";
    redirect(`/projects/${projectId}?success=${encodeURIComponent(message)}`);
  } catch (e) {
    errorRedirect(`/projects/${projectId}`, e);
  }
}
