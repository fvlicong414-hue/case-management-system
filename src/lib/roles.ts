export type Role = "forval_admin" | "customer_admin" | "staff";

export interface SessionUser {
  userId: string;
  tenantId: string;
  name: string;
  email: string;
  role: Role;
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "forval_admin":
      return "フォーバル管理者";
    case "customer_admin":
      return "顧客管理者";
    case "staff":
      return "担当者";
  }
}
