"use server";

import { revalidatePath } from "next/cache";
import { requireSession, can } from "@/lib/auth";
import { updateSettings } from "@/lib/db/settings";
import { getStr, getStrOrNull, getNumber, errorRedirect, successRedirect } from "./util";

export async function updateSettingsAction(formData: FormData) {
  const session = await requireSession();
  if (!can(session, "editSettings")) errorRedirect("/settings", new Error("設定変更の権限がありません"));
  try {
    await updateSettings(session.tenantId, {
      taxRate: getNumber(formData, "taxRate", 0.1) / 100,
      overheadRate: getNumber(formData, "overheadRate", 0) / 100,
      invoiceNumberPrefix: getStr(formData, "invoiceNumberPrefix") || "INV-",
      estimateNumberPrefix: getStr(formData, "estimateNumberPrefix") || "EST-",
      projectNumberPrefix: getStr(formData, "projectNumberPrefix") || "PRJ-",
      companyName: getStrOrNull(formData, "companyName"),
      companyPostalCode: getStrOrNull(formData, "companyPostalCode"),
      companyAddress: getStrOrNull(formData, "companyAddress"),
      companyPhone: getStrOrNull(formData, "companyPhone"),
      companyInvoiceRegistrationNumber: getStrOrNull(formData, "companyInvoiceRegistrationNumber"),
      bankInfo: getStrOrNull(formData, "bankInfo"),
    });
    revalidatePath("/settings");
    successRedirect("/settings", "設定を保存しました");
  } catch (e) {
    errorRedirect("/settings", e);
  }
}
