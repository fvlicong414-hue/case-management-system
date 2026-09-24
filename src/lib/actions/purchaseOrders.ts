"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, can } from "@/lib/auth";
import {
  createPurchaseOrder,
  addPurchaseOrderItem,
  deletePurchaseOrderItem,
  setPurchaseOrderStatus,
  type PurchaseOrderStatus,
} from "@/lib/db/purchaseOrders";
import { getStr, getStrOrNull, getNumber, errorRedirect, successRedirect } from "./util";

export async function createPurchaseOrderAction(formData: FormData) {
  const session = await requireSession();
  try {
    const order = await createPurchaseOrder(session.tenantId, {
      orderType: getStr(formData, "orderType") as any,
      supplierName: getStr(formData, "supplierName"),
      projectId: getStrOrNull(formData, "projectId"),
      title: getStrOrNull(formData, "title"),
      orderDate: getStr(formData, "orderDate") || new Date().toISOString().slice(0, 10),
      memo: getStrOrNull(formData, "memo"),
      createdBy: session.name,
    });
    revalidatePath("/purchase-orders");
    redirect(`/purchase-orders/${order.id}`);
  } catch (e) {
    errorRedirect("/purchase-orders/new", e);
  }
}

export async function addPurchaseOrderItemAction(purchaseOrderId: string, formData: FormData) {
  const session = await requireSession();
  try {
    await addPurchaseOrderItem(session.tenantId, purchaseOrderId, {
      itemCode: getStrOrNull(formData, "itemCode"),
      itemName: getStr(formData, "itemName"),
      specification: getStrOrNull(formData, "specification"),
      quantity: getNumber(formData, "quantity", 1),
      unit: getStrOrNull(formData, "unit"),
      memo: getStrOrNull(formData, "memo"),
    });
    revalidatePath(`/purchase-orders/${purchaseOrderId}`);
    successRedirect(`/purchase-orders/${purchaseOrderId}`, "明細を追加しました");
  } catch (e) {
    errorRedirect(`/purchase-orders/${purchaseOrderId}`, e);
  }
}

export async function deletePurchaseOrderItemAction(purchaseOrderId: string, itemId: string) {
  await requireSession();
  try {
    await deletePurchaseOrderItem(itemId);
    revalidatePath(`/purchase-orders/${purchaseOrderId}`);
    successRedirect(`/purchase-orders/${purchaseOrderId}`, "明細を削除しました");
  } catch (e) {
    errorRedirect(`/purchase-orders/${purchaseOrderId}`, e);
  }
}

export async function setPurchaseOrderStatusAction(id: string, status: PurchaseOrderStatus) {
  const session = await requireSession();
  if (status === "取消" && !can(session, "cancelReissue")) {
    errorRedirect(`/purchase-orders/${id}`, new Error("取消権限がありません"));
  }
  try {
    await setPurchaseOrderStatus(id, status);
    revalidatePath(`/purchase-orders/${id}`);
    successRedirect(`/purchase-orders/${id}`, `ステータスを「${status}」に変更しました`);
  } catch (e) {
    errorRedirect(`/purchase-orders/${id}`, e);
  }
}
