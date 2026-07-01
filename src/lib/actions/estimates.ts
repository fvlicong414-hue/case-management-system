"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, can } from "@/lib/auth";
import {
  createEstimate,
  updateEstimateHeader,
  addEstimateItem,
  updateEstimateItem,
  deleteEstimateItem,
  submitEstimate,
  markEstimateOrdered,
  markEstimateLost,
  cancelEstimate,
  duplicateEstimateAsNewVersion,
} from "@/lib/db/estimates";
import { getItemMaster } from "@/lib/db/itemMaster";
import { getProject } from "@/lib/db/projects";
import { getStr, getStrOrNull, getNumber, errorRedirect, successRedirect } from "./util";

export async function createEstimateAction(formData: FormData) {
  const session = await requireSession();
  try {
    const projectId = getStr(formData, "projectId");
    const project = await getProject(projectId);
    if (!project) throw new Error("案件が見つかりません");
    const estimate = await createEstimate(session.tenantId, {
      projectId,
      customerId: project.customerId,
      estimateDate: getStr(formData, "estimateDate") || new Date().toISOString().slice(0, 10),
      title: getStrOrNull(formData, "title") ?? undefined,
      memo: getStrOrNull(formData, "memo") ?? undefined,
      createdBy: session.name,
    });
    revalidatePath("/estimates");
    redirect(`/estimates/${estimate.id}`);
  } catch (e) {
    errorRedirect("/estimates/new", e);
  }
}

export async function updateEstimateHeaderAction(id: string, formData: FormData) {
  await requireSession();
  try {
    await updateEstimateHeader(id, {
      title: getStrOrNull(formData, "title"),
      estimateDate: getStr(formData, "estimateDate"),
      memo: getStrOrNull(formData, "memo"),
    });
    revalidatePath(`/estimates/${id}`);
    successRedirect(`/estimates/${id}`, "更新しました");
  } catch (e) {
    errorRedirect(`/estimates/${id}`, e);
  }
}

export async function addEstimateItemAction(estimateId: string, formData: FormData) {
  await requireSession();
  try {
    const itemMasterId = getStrOrNull(formData, "itemMasterId");
    const master = itemMasterId ? await getItemMaster(itemMasterId) : undefined;
    await addEstimateItem(estimateId, {
      itemMasterId: itemMasterId,
      itemName: getStr(formData, "itemName") || master?.name || "",
      specification: getStrOrNull(formData, "specification") ?? master?.specification ?? null,
      quantity: getNumber(formData, "quantity", 1),
      unit: getStrOrNull(formData, "unit") ?? master?.unit ?? null,
      salesUnitPrice: getNumber(formData, "salesUnitPrice", master?.defaultSalesPrice ?? 0),
      costUnitPrice: getNumber(formData, "costUnitPrice", master?.defaultCostPrice ?? 0),
      memo: getStrOrNull(formData, "memo"),
    });
    revalidatePath(`/estimates/${estimateId}`);
    successRedirect(`/estimates/${estimateId}`, "明細を追加しました");
  } catch (e) {
    errorRedirect(`/estimates/${estimateId}`, e);
  }
}

export async function updateEstimateItemAction(estimateId: string, itemId: string, formData: FormData) {
  await requireSession();
  try {
    await updateEstimateItem(itemId, {
      itemName: getStr(formData, "itemName"),
      specification: getStrOrNull(formData, "specification"),
      quantity: getNumber(formData, "quantity", 1),
      unit: getStrOrNull(formData, "unit"),
      salesUnitPrice: getNumber(formData, "salesUnitPrice"),
      costUnitPrice: getNumber(formData, "costUnitPrice"),
      memo: getStrOrNull(formData, "memo"),
    });
    revalidatePath(`/estimates/${estimateId}`);
    successRedirect(`/estimates/${estimateId}`, "明細を更新しました");
  } catch (e) {
    errorRedirect(`/estimates/${estimateId}`, e);
  }
}

export async function deleteEstimateItemAction(estimateId: string, itemId: string) {
  await requireSession();
  try {
    await deleteEstimateItem(itemId);
    revalidatePath(`/estimates/${estimateId}`);
    successRedirect(`/estimates/${estimateId}`, "明細を削除しました");
  } catch (e) {
    errorRedirect(`/estimates/${estimateId}`, e);
  }
}

export async function submitEstimateAction(id: string) {
  await requireSession();
  try {
    await submitEstimate(id);
    revalidatePath(`/estimates/${id}`);
    successRedirect(`/estimates/${id}`, "提出済にしました");
  } catch (e) {
    errorRedirect(`/estimates/${id}`, e);
  }
}

export async function markEstimateOrderedAction(id: string) {
  await requireSession();
  try {
    await markEstimateOrdered(id);
    revalidatePath(`/estimates/${id}`);
    successRedirect(`/estimates/${id}`, "受注にしました");
  } catch (e) {
    errorRedirect(`/estimates/${id}`, e);
  }
}

export async function markEstimateLostAction(id: string) {
  await requireSession();
  try {
    await markEstimateLost(id);
    revalidatePath(`/estimates/${id}`);
    successRedirect(`/estimates/${id}`, "失注にしました");
  } catch (e) {
    errorRedirect(`/estimates/${id}`, e);
  }
}

export async function cancelEstimateAction(id: string) {
  const session = await requireSession();
  if (!can(session, "cancelReissue")) errorRedirect(`/estimates/${id}`, new Error("取消権限がありません"));
  try {
    await cancelEstimate(id);
    revalidatePath(`/estimates/${id}`);
    successRedirect(`/estimates/${id}`, "取消にしました");
  } catch (e) {
    errorRedirect(`/estimates/${id}`, e);
  }
}

export async function duplicateEstimateAction(id: string) {
  const session = await requireSession();
  try {
    const newEstimate = await duplicateEstimateAsNewVersion(id, session.name);
    revalidatePath("/estimates");
    redirect(`/estimates/${newEstimate.id}?success=${encodeURIComponent("新版を作成しました")}`);
  } catch (e) {
    errorRedirect(`/estimates/${id}`, e);
  }
}
