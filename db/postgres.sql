-- ============================================================================
-- 本番用 PostgreSQL(Supabase等)スキーマ
-- prisma/schema.prisma とテーブル名・カラム名を完全に一致させています。
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'active',
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_code TEXT NOT NULL,
  name TEXT NOT NULL,
  billing_name TEXT,
  postal_code TEXT,
  address TEXT,
  phone TEXT,
  contact_person TEXT,
  closing_day TEXT,
  payment_terms TEXT,
  invoice_format_id TEXT,
  quote_format_id TEXT,
  spec_format_id TEXT,
  memo TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_code TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  site_name TEXT,
  site_address TEXT,
  internal_owner_id TEXT,
  customer_contact TEXT,
  work_category TEXT,
  status TEXT NOT NULL DEFAULT '見積中',
  start_plan_date TEXT,
  completion_plan_date TEXT,
  completed_date TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS item_master (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  item_code TEXT NOT NULL,
  name TEXT NOT NULL,
  specification TEXT,
  unit TEXT,
  default_sales_price DOUBLE PRECISION NOT NULL DEFAULT 0,
  default_cost_price DOUBLE PRECISION NOT NULL DEFAULT 0,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estimates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  estimate_no TEXT NOT NULL,
  project_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  estimate_date TEXT NOT NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT '作成中',
  version INTEGER NOT NULL DEFAULT 1,
  original_estimate_id TEXT,
  sales_total DOUBLE PRECISION NOT NULL DEFAULT 0,
  cost_total DOUBLE PRECISION NOT NULL DEFAULT 0,
  gross_profit DOUBLE PRECISION NOT NULL DEFAULT 0,
  gross_profit_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  overhead_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  overhead_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  operating_profit DOUBLE PRECISION NOT NULL DEFAULT 0,
  tax_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_with_tax DOUBLE PRECISION NOT NULL DEFAULT 0,
  memo TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estimate_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  estimate_id TEXT NOT NULL,
  item_master_id TEXT,
  item_name TEXT NOT NULL,
  specification TEXT,
  quantity DOUBLE PRECISION NOT NULL DEFAULT 1,
  unit TEXT,
  sales_unit_price DOUBLE PRECISION NOT NULL DEFAULT 0,
  sales_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  cost_unit_price DOUBLE PRECISION NOT NULL DEFAULT 0,
  cost_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  gross_profit DOUBLE PRECISION NOT NULL DEFAULT 0,
  memo TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS specifications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  estimate_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  construction_scope TEXT,
  materials TEXT,
  method TEXT,
  notes TEXT,
  warranty TEXT,
  status TEXT NOT NULL DEFAULT '作成中',
  pdf_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_schedules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  estimate_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  billing_month TEXT NOT NULL,
  billing_type TEXT NOT NULL,
  scheduled_amount DOUBLE PRECISION NOT NULL,
  cost_allocated DOUBLE PRECISION NOT NULL DEFAULT 0,
  gross_profit DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT '未請求',
  invoice_id TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  invoice_no TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  billing_month TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  payment_due_date TEXT,
  subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
  tax_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  cost_total DOUBLE PRECISION NOT NULL DEFAULT 0,
  gross_profit DOUBLE PRECISION NOT NULL DEFAULT 0,
  overhead_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  operating_profit DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT '下書き',
  paid_date TEXT,
  pdf_path TEXT,
  canceled_invoice_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  billing_schedule_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  site_name TEXT,
  billing_type TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_formats (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  template_file TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  pdf_path TEXT,
  file_name TEXT NOT NULL,
  output_by TEXT,
  output_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT '出力済',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE,
  tax_rate DOUBLE PRECISION NOT NULL DEFAULT 0.10,
  overhead_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  invoice_number_prefix TEXT NOT NULL DEFAULT 'INV-',
  estimate_number_prefix TEXT NOT NULL DEFAULT 'EST-',
  project_number_prefix TEXT NOT NULL DEFAULT 'PRJ-',
  company_name TEXT,
  company_postal_code TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_invoice_registration_number TEXT,
  bank_info TEXT,
  seal_image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_item_master_tenant ON item_master(tenant_id);
CREATE INDEX IF NOT EXISTS idx_estimates_tenant ON estimates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_estimates_project ON estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate ON estimate_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_specifications_estimate ON specifications(estimate_id);
CREATE INDEX IF NOT EXISTS idx_billing_schedules_tenant ON billing_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_schedules_customer ON billing_schedules(customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_schedules_invoice ON billing_schedules(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_document_logs_tenant ON document_logs(tenant_id);
