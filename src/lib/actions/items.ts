"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, can } from "@/lib/auth";
import { createItemMaster, updateItemMaster } from "@/lib/db/itemMaster";
import { upsertPriceTier, deletePriceTier } from "@/lib/db/itemPriceTiers";
import { importItemMasterFromExcel } from "@/lib/import/importItemMaster";
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

export async function importItemMasterAction(formData: FormData) {
  const session = await requireSession();
  if (!can(session, "editMasters")) errorRedirect("/items/import", new Error("インポート権限がありません"));
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Excelファイルを選択してください");
    }
    const sheetName = getStrOrNull(formData, "sheetName") ?? undefined;
    const buffer = Buffer.from(await file.arrayBuffer());
    const summary = await importItemMasterFromExcel(session.tenantId, buffer, sheetName);
    revalidatePath("/items");
    successRedirect(
      "/items",
      `取り込み完了: 検出${summary.totalParsed}件(新規${summary.created}件・更新${summary.updated}件、価格帯${summary.tiersWritten}件)`
    );
  } catch (e) {
    errorRedirect("/items/import", e);
  }
}

export async function upsertPriceTierAction(itemId: string, formData: FormData) {
  const session = await requireSession();
  if (!can(session, "editMasters")) errorRedirect(`/items/${itemId}`, new Error("編集権限がありません"));
  try {
    const tierName = getStr(formData, "tierName");
    if (!tierName) throw new Error("価格区分名を入力してください");
    await upsertPriceTier(session.tenantId, itemId, tierName, getNumber(formData, "salesPrice", 0));
    revalidatePath(`/items/${itemId}`);
    successRedirect(`/items/${itemId}`, "価格帯を保存しました");
  } catch (e) {
    errorRedirect(`/items/${itemId}`, e);
  }
}

export async function deletePriceTierAction(itemId: string, tierId: string) {
  const session = await requireSession();
  if (!can(session, "editMasters")) errorRedirect(`/items/${itemId}`, new Error("削除権限がありません"));
  try {
    await deletePriceTier(tierId);
    revalidatePath(`/items/${itemId}`);
    successRedirect(`/items/${itemId}`, "価格帯を削除しました");
  } catch (e) {
    errorRedirect(`/items/${itemId}`, e);
  }
}
