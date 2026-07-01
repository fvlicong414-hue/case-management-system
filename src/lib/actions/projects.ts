"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createProject, updateProject, updateProjectStatus } from "@/lib/db/projects";
import { getStr, getStrOrNull, errorRedirect, successRedirect } from "./util";
import type { ProjectStatus } from "@/lib/db/types";

export async function createProjectAction(formData: FormData) {
  const session = await requireSession();
  try {
    const project = await createProject(session.tenantId, {
      customerId: getStr(formData, "customerId"),
      projectName: getStr(formData, "projectName"),
      siteName: getStrOrNull(formData, "siteName"),
      siteAddress: getStrOrNull(formData, "siteAddress"),
      internalOwnerId: null,
      customerContact: getStrOrNull(formData, "customerContact"),
      workCategory: getStrOrNull(formData, "workCategory"),
      status: "見積中",
      startPlanDate: getStrOrNull(formData, "startPlanDate"),
      completionPlanDate: getStrOrNull(formData, "completionPlanDate"),
      completedDate: null,
      memo: getStrOrNull(formData, "memo"),
    });
    revalidatePath("/projects");
    redirect(`/projects/${project.id}?success=${encodeURIComponent("案件を登録しました")}`);
  } catch (e) {
    errorRedirect("/projects/new", e);
  }
}

export async function updateProjectAction(id: string, formData: FormData) {
  await requireSession();
  try {
    await updateProject(id, {
      projectName: getStr(formData, "projectName"),
      siteName: getStrOrNull(formData, "siteName"),
      siteAddress: getStrOrNull(formData, "siteAddress"),
      customerContact: getStrOrNull(formData, "customerContact"),
      workCategory: getStrOrNull(formData, "workCategory"),
      startPlanDate: getStrOrNull(formData, "startPlanDate"),
      completionPlanDate: getStrOrNull(formData, "completionPlanDate"),
      completedDate: getStrOrNull(formData, "completedDate"),
      memo: getStrOrNull(formData, "memo"),
    });
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    successRedirect(`/projects/${id}`, "更新しました");
  } catch (e) {
    errorRedirect(`/projects/${id}`, e);
  }
}

export async function changeProjectStatusAction(id: string, status: ProjectStatus) {
  await requireSession();
  try {
    await updateProjectStatus(id, status);
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    successRedirect(`/projects/${id}`, `ステータスを「${status}」に変更しました`);
  } catch (e) {
    errorRedirect(`/projects/${id}`, e);
  }
}
