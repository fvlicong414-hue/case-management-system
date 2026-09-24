import { query, queryOne, generateId, nowIso } from "./client";
import type { Project } from "./types";
import { generateNumber } from "./numbering";
import { getSettings } from "./settings";

const SELECT_COLS = `id, tenant_id as "tenantId", project_code as "projectCode", customer_id as "customerId",
  project_name as "projectName", site_name as "siteName", site_address as "siteAddress",
  internal_owner_id as "internalOwnerId", customer_contact as "customerContact",
  work_category as "workCategory", status, start_plan_date as "startPlanDate",
  completion_plan_date as "completionPlanDate", completed_date as "completedDate", memo,
  created_at as "createdAt", updated_at as "updatedAt"`;

export interface ProjectSearch {
  projectCode?: string;
  projectName?: string;
  siteName?: string;
  customerId?: string;
  customerName?: string;
  internalOwnerId?: string;
  workCategory?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listProjects(
  tenantId: string,
  search: ProjectSearch = {}
): Promise<(Project & { customerName?: string })[]> {
  const clauses = ["p.tenant_id = $1"];
  const params: any[] = [tenantId];
  let i = 2;
  if (search.projectCode) {
    clauses.push(`p.project_code ILIKE $${i++}`);
    params.push(`%${search.projectCode}%`);
  }
  if (search.projectName) {
    clauses.push(`p.project_name ILIKE $${i++}`);
    params.push(`%${search.projectName}%`);
  }
  if (search.siteName) {
    clauses.push(`p.site_name ILIKE $${i++}`);
    params.push(`%${search.siteName}%`);
  }
  if (search.customerId) {
    clauses.push(`p.customer_id = $${i++}`);
    params.push(search.customerId);
  }
  if (search.customerName) {
    clauses.push(`c.name ILIKE $${i++}`);
    params.push(`%${search.customerName}%`);
  }
  if (search.workCategory) {
    clauses.push(`p.work_category ILIKE $${i++}`);
    params.push(`%${search.workCategory}%`);
  }
  if (search.status) {
    clauses.push(`p.status = $${i++}`);
    params.push(search.status);
  }
  if (search.dateFrom) {
    clauses.push(`p.start_plan_date >= $${i++}`);
    params.push(search.dateFrom);
  }
  if (search.dateTo) {
    clauses.push(`p.start_plan_date <= $${i++}`);
    params.push(search.dateTo);
  }
  const sql = `SELECT p.id, p.tenant_id as "tenantId", p.project_code as "projectCode", p.customer_id as "customerId",
      p.project_name as "projectName", p.site_name as "siteName", p.site_address as "siteAddress",
      p.internal_owner_id as "internalOwnerId", p.customer_contact as "customerContact",
      p.work_category as "workCategory", p.status, p.start_plan_date as "startPlanDate",
      p.completion_plan_date as "completionPlanDate", p.completed_date as "completedDate", p.memo,
      p.created_at as "createdAt", p.updated_at as "updatedAt", c.name as "customerName"
    FROM projects p LEFT JOIN customers c ON c.id = p.customer_id
    WHERE ${clauses.join(" AND ")} ORDER BY p.created_at DESC`;
  return query(sql, params);
}

export async function getProject(id: string): Promise<Project | undefined> {
  return queryOne<Project>(`SELECT ${SELECT_COLS} FROM projects WHERE id = $1`, [id]);
}

export async function createProject(
  tenantId: string,
  input: Omit<Project, "id" | "tenantId" | "projectCode" | "createdAt" | "updatedAt">
): Promise<Project> {
  const id = generateId();
  const now = nowIso();
  const settings = await getSettings(tenantId);
  const projectCode = await generateNumber("projects", "project_code", tenantId, settings.projectNumberPrefix);
  await query(
    `INSERT INTO projects (id, tenant_id, project_code, customer_id, project_name, site_name, site_address,
      internal_owner_id, customer_contact, work_category, status, start_plan_date, completion_plan_date,
      completed_date, memo, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [
      id,
      tenantId,
      projectCode,
      input.customerId,
      input.projectName,
      input.siteName,
      input.siteAddress,
      input.internalOwnerId,
      input.customerContact,
      input.workCategory,
      input.status || "見積中",
      input.startPlanDate,
      input.completionPlanDate,
      input.completedDate,
      input.memo,
      now,
      now,
    ]
  );
  return (await getProject(id))!;
}

export async function updateProject(id: string, input: Partial<Project>): Promise<Project> {
  const current = await getProject(id);
  if (!current) throw new Error("案件が見つかりません");
  const merged = { ...current, ...input };
  const now = nowIso();
  await query(
    `UPDATE projects SET customer_id = $1, project_name = $2, site_name = $3, site_address = $4,
      internal_owner_id = $5, customer_contact = $6, work_category = $7, status = $8,
      start_plan_date = $9, completion_plan_date = $10, completed_date = $11, memo = $12, updated_at = $13
      WHERE id = $14`,
    [
      merged.customerId,
      merged.projectName,
      merged.siteName,
      merged.siteAddress,
      merged.internalOwnerId,
      merged.customerContact,
      merged.workCategory,
      merged.status,
      merged.startPlanDate,
      merged.completionPlanDate,
      merged.completedDate,
      merged.memo,
      now,
      id,
    ]
  );
  return (await getProject(id))!;
}

export async function updateProjectStatus(id: string, status: Project["status"]): Promise<Project> {
  return updateProject(id, { status });
}
