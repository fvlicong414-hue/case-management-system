"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { upsertSpecification, publishSpecification, cancelSpecification } from "@/lib/db/specifications";
import { getEstimate } from "@/lib/db/estimates";
import { getStrOrNull, errorRedirect, successRedirect } from "./util";

export async function saveSpecificationAction(estimateId: string, formData: FormData) {
  const session = await requireSession();
  try {
    const estimate = await getEstimate(estimateId);
    if (!estimate) throw new Error("見積が見つかりません");
    await upsertSpecification(session.tenantId, {
      estimateId,
      projectId: estimate.projectId,
      constructionScope: getStrOrNull(formData, "constructionScope"),
      materials: getStrOrNull(formData, "materials"),
      method: getStrOrNull(formData, "method"),
      notes: getStrOrNull(formData, "notes"),
      warranty: getStrOrNull(formData, "warranty"),
    });
    revalidatePath(`/estimates/${estimateId}`);
    successRedirect(`/estimates/${estimateId}`, "仕様書を保存しました");
  } catch (e) {
    errorRedirect(`/estimates/${estimateId}`, e);
  }
}

export async function publishSpecificationAction(estimateId: string, specId: string) {
  await requireSession();
  try {
    await publishSpecification(specId);
    revalidatePath(`/estimates/${estimateId}`);
    successRedirect(`/estimates/${estimateId}`, "仕様書を発行済にしました");
  } catch (e) {
    errorRedirect(`/estimates/${estimateId}`, e);
  }
}

export async function cancelSpecificationAction(estimateId: string, specId: string) {
  await requireSession();
  try {
    await cancelSpecification(specId);
    revalidatePath(`/estimates/${estimateId}`);
    successRedirect(`/estimates/${estimateId}`, "仕様書を取消にしました");
  } catch (e) {
    errorRedirect(`/estimates/${estimateId}`, e);
  }
}
