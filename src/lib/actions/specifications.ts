"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { upsertSpecification, publishSpecification, cancelSpecification } from "@/lib/db/specifications";
import { getEstimate } from "@/lib/db/estimates";
import { getStrOrNull, errorRedirect, successRedirect } from "./util";

// 仕様書は見積の詳細ページではなく、案件詳細ページ(/projects/[id])に統合されているため、
// 保存・発行・取消のいずれの操作後も、その見積が属する案件のページに戻す。

export async function saveSpecificationAction(estimateId: string, formData: FormData) {
  const session = await requireSession();
  const estimate = await getEstimate(estimateId);
  const projectPath = estimate ? `/projects/${estimate.projectId}` : "/projects";
  try {
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
    revalidatePath(projectPath);
    successRedirect(projectPath, "仕様書を保存しました");
  } catch (e) {
    errorRedirect(projectPath, e);
  }
}

export async function publishSpecificationAction(estimateId: string, specId: string) {
  await requireSession();
  const estimate = await getEstimate(estimateId);
  const projectPath = estimate ? `/projects/${estimate.projectId}` : "/projects";
  try {
    await publishSpecification(specId);
    revalidatePath(projectPath);
    successRedirect(projectPath, "仕様書を発行済にしました");
  } catch (e) {
    errorRedirect(projectPath, e);
  }
}

export async function cancelSpecificationAction(estimateId: string, specId: string) {
  await requireSession();
  const estimate = await getEstimate(estimateId);
  const projectPath = estimate ? `/projects/${estimate.projectId}` : "/projects";
  try {
    await cancelSpecification(specId);
    revalidatePath(projectPath);
    successRedirect(projectPath, "仕様書を取消にしました");
  } catch (e) {
    errorRedirect(projectPath, e);
  }
}
