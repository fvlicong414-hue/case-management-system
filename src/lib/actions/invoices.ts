"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, can } from "@/lib/auth";
import { createInvoiceFromSchedules, markInvoiceSent, markInvoicePaid, cancelInvoice, reissueInvoice } from "@/lib/db/invoices";
import { getStr, errorRedirect, successRedirect } from "./util";

export async function createInvoiceAction(formData: FormData) {
  const session = await requireSession();
  const customerId = getStr(formData, "customerId");
  const billingMonth = getStr(formData, "billingMonth");
  const billingScheduleIds = formData.getAll("scheduleIds").map(String);
  try {
    const invoice = await createInvoiceFromSchedules(session.tenantId, {
      customerId,
      billingMonth,
      billingScheduleIds,
      createdBy: session.name,
    });
    revalidatePath("/invoices");
    revalidatePath("/billing-schedules");
    redirect(`/invoices/${invoice.id}?success=${encodeURIComponent("請求書を作成しました")}`);
  } catch (e) {
    errorRedirect(
      `/invoices/new?customerId=${customerId}&billingMonth=${billingMonth}`,
      e
    );
  }
}

export async function markInvoiceSentAction(id: string) {
  await requireSession();
  try {
    await markInvoiceSent(id);
    revalidatePath(`/invoices/${id}`);
    successRedirect(`/invoices/${id}`, "送付済にしました");
  } catch (e) {
    errorRedirect(`/invoices/${id}`, e);
  }
}

export async function markInvoicePaidAction(id: string, formData: FormData) {
  await requireSession();
  try {
    const paidDate = getStr(formData, "paidDate");
    await markInvoicePaid(id, paidDate);
    revalidatePath(`/invoices/${id}`);
    revalidatePath("/billing-schedules");
    successRedirect(`/invoices/${id}`, "入金済にしました");
  } catch (e) {
    errorRedirect(`/invoices/${id}`, e);
  }
}

export async function cancelInvoiceAction(id: string) {
  const session = await requireSession();
  if (!can(session, "cancelReissue")) errorRedirect(`/invoices/${id}`, new Error("取消権限がありません"));
  try {
    await cancelInvoice(id);
    revalidatePath(`/invoices/${id}`);
    revalidatePath("/billing-schedules");
    successRedirect(`/invoices/${id}`, "取消にしました");
  } catch (e) {
    errorRedirect(`/invoices/${id}`, e);
  }
}

export async function reissueInvoiceAction(id: string) {
  const session = await requireSession();
  if (!can(session, "cancelReissue")) errorRedirect(`/invoices/${id}`, new Error("再発行権限がありません"));
  try {
    const newInvoice = await reissueInvoice(id, session.tenantId, session.name);
    revalidatePath("/invoices");
    revalidatePath("/billing-schedules");
    redirect(`/invoices/${newInvoice.id}?success=${encodeURIComponent("再発行しました")}`);
  } catch (e) {
    errorRedirect(`/invoices/${id}`, e);
  }
}
