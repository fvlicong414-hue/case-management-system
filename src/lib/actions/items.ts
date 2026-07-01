"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, can } from "@/lib/auth";
import { createItemMaster, updateItemMaster } from "@/lib/db/itemMaster";
import { getStr, getStrOrNull, getNumber, errorRedirect, successRedirect } from "./util";

export async function createItemMasterAction(formData: FormData) {
  const session = await requireSession();
  try {
    await createItemMaster(session.tenantId, {
      itemCode: getStr(formData, "itemCode"),
      name: getStr(formData, "name"),
      specification: getStrOrNull(formData, "specification"),
      unit: getStrOrNull(formData, "unit"),
      defaultSalesPrice: getNumber(formData, "defaultSalesPrice"),
      defaultCostPrice: getNumber(formData, "defaultCostPrice"),
      category: getStrOrNull(formData, "category"),
    });
    revalidatePath("/items");
  } catch (e) {
    errorRedirect("/items/new", e);
  }
  redirect("/items?success=" + encodeURIComponent("品目を登録しました"));
}

export async function updateItemMasterAction(id: string, formData: FormData) {
  const session = await requireSession();
  if (!can(session, "editMasters")) errorRedirect(`/items/${id}`, new Error("編集権限がありません"));
  try {
    await updateItemMaster(id, {
      itemCode: getStr(formData, "itemCode"),
      name: getStr(formData, "name"),
      specification: getStrOrNull(formData, "specification"),
      unit: getStrOrNull(formData, "unit"),
      defaultSalesPrice: getNumber(formData, "defaultSalesPrice"),
      defaultCostPrice: getNumber(formData, "defaultCostPrice"),
      category: getStrOrNull(formData, "category"),
    });
    revalidatePath("/items");
    successRedirect("/items", "更新しました");
  } catch (e) {
    errorRedirect(`/items/${id}`, e);
  }
}

export async function toggleItemActiveAction(id: string, isActive: boolean) {
  const session = await requireSession();
  if (!can(session, "editMasters")) errorRedirect("/items", new Error("権限がありません"));
  try {
    await updateItemMaster(id, { isActive });
    revalidatePath("/items");
    successRedirect("/items", isActive ? "有効化しました" : "無効化しました");
  } catch (e) {
    errorRedirect("/items", e);
  }
}
