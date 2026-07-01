export interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "forval_admin" | "customer_admin" | "staff";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  customerCode: string;
  name: string;
  billingName: string | null;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  contactPerson: string | null;
  closingDay: string | null;
  paymentTerms: string | null;
  invoiceFormatId: string | null;
  quoteFormatId: string | null;
  specFormatId: string | null;
  memo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus =
  | "見積中"
  | "受注"
  | "施工中"
  | "完了"
  | "請求中"
  | "入金済"
  | "失注"
  | "保留"
  | "取消";

export interface Project {
  id: string;
  tenantId: string;
  projectCode: string;
  customerId: string;
  projectName: string;
  siteName: string | null;
  siteAddress: string | null;
  internalOwnerId: string | null;
  customerContact: string | null;
  workCategory: string | null;
  status: ProjectStatus;
  startPlanDate: string | null;
  completionPlanDate: string | null;
  completedDate: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemMaster {
  id: string;
  tenantId: string;
  itemCode: string;
  name: string;
  specification: string | null;
  unit: string | null;
  defaultSalesPrice: number;
  defaultCostPrice: number;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EstimateStatus = "作成中" | "提出済" | "受注" | "失注" | "取消";

export interface Estimate {
  id: string;
  tenantId: string;
  estimateNo: string;
  projectId: string;
  customerId: string;
  estimateDate: string;
  title: string | null;
  status: EstimateStatus;
  version: number;
  originalEstimateId: string | null;
  salesTotal: number;
  costTotal: number;
  grossProfit: number;
  grossProfitRate: number;
  overheadRate: number;
  overheadAmount: number;
  operatingProfit: number;
  taxAmount: number;
  totalWithTax: number;
  memo: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateItem {
  id: string;
  tenantId: string;
  estimateId: string;
  itemMasterId: string | null;
  itemName: string;
  specification: string | null;
  quantity: number;
  unit: string | null;
  salesUnitPrice: number;
  salesAmount: number;
  costUnitPrice: number;
  costAmount: number;
  grossProfit: number;
  memo: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type SpecificationStatus = "作成中" | "発行済" | "取消";

export interface Specification {
  id: string;
  tenantId: string;
  estimateId: string;
  projectId: string;
  constructionScope: string | null;
  materials: string | null;
  method: string | null;
  notes: string | null;
  warranty: string | null;
  status: SpecificationStatus;
  pdfPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BillingType = "通常" | "着手金" | "中間金" | "完了金" | "追加";
export type BillingScheduleStatus =
  | "未請求"
  | "請求書作成済"
  | "発行済"
  | "送付済"
  | "入金済"
  | "取消";

export interface BillingSchedule {
  id: string;
  tenantId: string;
  estimateId: string;
  projectId: string;
  customerId: string;
  billingMonth: string;
  billingType: BillingType;
  scheduledAmount: number;
  costAllocated: number;
  grossProfit: number;
  status: BillingScheduleStatus;
  invoiceId: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = "下書き" | "発行済" | "送付済" | "入金済" | "取消" | "再発行済";

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNo: string;
  customerId: string;
  billingMonth: string;
  invoiceDate: string;
  paymentDueDate: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  costTotal: number;
  grossProfit: number;
  overheadAmount: number;
  operatingProfit: number;
  status: InvoiceStatus;
  paidDate: string | null;
  pdfPath: string | null;
  canceledInvoiceId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  tenantId: string;
  invoiceId: string;
  billingScheduleId: string;
  projectId: string;
  siteName: string | null;
  billingType: BillingType;
  amount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = "estimate" | "specification" | "invoice";

export interface DocumentFormat {
  id: string;
  tenantId: string;
  name: string;
  documentType: DocumentType;
  templateFile: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DocumentLogType = "見積書" | "仕様書" | "請求書";
export type DocumentLogStatus = "出力済" | "取消" | "再発行";

export interface DocumentLog {
  id: string;
  tenantId: string;
  documentType: DocumentLogType;
  targetId: string;
  pdfPath: string | null;
  fileName: string;
  outputBy: string | null;
  outputAt: string;
  status: DocumentLogStatus;
  createdAt: string;
}

export interface Settings {
  id: string;
  tenantId: string;
  taxRate: number;
  overheadRate: number;
  invoiceNumberPrefix: string;
  estimateNumberPrefix: string;
  projectNumberPrefix: string;
  companyName: string | null;
  companyPostalCode: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyInvoiceRegistrationNumber: string | null;
  bankInfo: string | null;
  sealImagePath: string | null;
  createdAt: string;
  updatedAt: string;
}
