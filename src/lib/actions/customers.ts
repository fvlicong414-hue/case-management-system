"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, can } from "@/lib/auth";
import { createCustomer, updateCustomer, setCustomerActive } from "@/lib/db/customers";
import { getStr, getStrOrNull, errorRedirect, successRedirect } from "./util";

export async function createCustomerAction(formData: FormData) {
  const session = await requireSession();
  try {
    const customer = await createCustomer(session.tenantId, {
      name: getStr(formData, "name"),
      billingName: getStrOrNull(formData, "billingName"),
      postalCode: getStrOrNull(formData, "postalCode"),
      address: getStrOrNull(formData, "address"),
      phone: getStrOrNull(formData, "phone"),
      contactPerson: getStrOrNull(formData, "contactPerson"),
      closingDay: getStrOrNull(formData, "closingDay"),
      paymentTerms: getStrOrNull(formData, "paymentTerms"),
      invoiceFormatId: null,
      quoteFormatId: null,
      specFormatId: null,
      memo: getStrOrNull(formData, "memo"),
    } as any);
    revalidatePath("/customers");
    redirect(`/customers/${customer.id}?success=${encodeURIComponent("顧客を登録しました")}`);
  } catch (e) {
    errorRedirect("/customers/new", e);
  }
}

export async function updateCustomerAction(id: string, formData: FormData) {
  const session = await requireSession();
  if (!can(session, "editMasters")) errorRedirect(`/customers/${id}`, new Error("編集権限がありません"));
  try {
    await updateCustomer(id, {
      name: getStr(formData, "name"),
      billingName: getStrOrNull(formData, "billingName"),
      postalCode: getStrOrNull(formData, "postalCode"),
      address: getStrOrNull(formData, "address"),
      phone: getStrOrNull(formData, "phone"),
      contactPerson: getStrOrNull(formData, "contactPerson"),
      closingDay: getStrOrNull(formData, "closingDay"),
      paymentTerms: getStrOrNull(formData, "paymentTerms"),
      memo: getStrOrNull(formData, "memo"),
    });
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    successRedirect(`/customers/${id}`, "更新しました");
  } catch (e) {
    errorRedirect(`/customers/${id}`, e);
  }
}

export async function toggleCustomerActiveAction(id: string, isActive: boolean) {
  const session = await requireSession();
  if (!can(session, "editMasters")) errorRedirect(`/customers/${id}`, new Error("権限がありません"));
  try {
    await setCustomerActive(id, isActive);
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    successRedirect(`/customers/${id}`, isActive ? "有効化しました" : "無効化しました");
  } catch (e) {
    errorRedirect(`/customers/${id}`, e);
  }
}
