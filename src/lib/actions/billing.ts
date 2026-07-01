"use server";

import { revalidatePath } from "next/cache";
import { requireSession, can } from "@/lib/auth";
import { createBillingSchedules, updateBillingScheduleCost } from "@/lib/db/billingSchedules";
import { getStr, getNumber, errorRedirect, successRedirect } from "./util";
import type { BillingType } from "@/lib/db/types";

/**
 * フォームからは以下の形式で複数行を受け取る想定:
 * billingType_0, billingMonth_0, scheduledAmount_0, memo_0 ... billingType_1, ...
 */
export async function createBillingSchedulesAction(estimateId: string, formData: FormData) {
  const session = await requireSession();
  const rowCount = getNumber(formData, "rowCount", 1);
  const schedules: { billingType: BillingType; billingMonth: string; scheduledAmount: number; memo?: string }[] = [];
  for (let i = 0; i < rowCount; i++) {
    const billingType = getStr(formData, `billingType_${i}`) as BillingType;
    const billingMonth = getStr(formData, `billingMonth_${i}`);
    const scheduledAmount = getNumber(formData, `scheduledAmount_${i}`, 0);
    if (!billingType || !billingMonth || scheduledAmount <= 0) continue;
    schedules.push({ billingType, billingMonth, scheduledAmount });
  }
  const allowMismatch = formData.get("allowMismatch") === "on" && can(session, "cancelReissue");
  try {
    const result = await createBillingSchedules({ estimateId, schedules }, { allowMismatch });
    revalidatePath("/billing-schedules");
    revalidatePath(`/estimates/${estimateId}`);
    if (result.warning) {
      successRedirect(`/estimates/${estimateId}`, `請求予定を作成しました(注意: ${result.warning})`);
    }
    successRedirect(`/estimates/${estimateId}`, "請求予定を作成しました");
  } catch (e) {
    errorRedirect(`/estimates/${estimateId}`, e);
  }
}

export async function updateBillingScheduleCostAction(id: string, formData: FormData) {
  const session = await requireSession();
  if (!can(session, "editMasters")) errorRedirect("/billing-schedules", new Error("権限がありません"));
  try {
    await updateBillingScheduleCost(id, getNumber(formData, "costAllocated", 0));
    revalidatePath("/billing-schedules");
    successRedirect("/billing-schedules", "原価按分額を更新しました");
  } catch (e) {
    errorRedirect("/billing-schedules", e);
  }
}
