import { query, queryOne, generateId, nowIso } from "./client";
import type { Specification } from "./types";

const COLS = `id, tenant_id as "tenantId", estimate_id as "estimateId", project_id as "projectId",
  construction_scope as "constructionScope", materials, method, notes, warranty, status,
  pdf_path as "pdfPath", created_at as "createdAt", updated_at as "updatedAt"`;

export async function getSpecificationByEstimate(estimateId: string): Promise<Specification | undefined> {
  return queryOne<Specification>(`SELECT ${COLS} FROM specifications WHERE estimate_id = $1`, [estimateId]);
}

export async function getSpecification(id: string): Promise<Specification | undefined> {
  return queryOne<Specification>(`SELECT ${COLS} FROM specifications WHERE id = $1`, [id]);
}

export async function upsertSpecification(
  tenantId: string,
  input: {
    estimateId: string;
    projectId: string;
    constructionScope?: string | null;
    materials?: string | null;
    method?: string | null;
    notes?: string | null;
    warranty?: string | null;
  }
): Promise<Specification> {
  const existing = await getSpecificationByEstimate(input.estimateId);
  const now = nowIso();
  if (existing) {
    if (existing.status !== "作成中") {
      throw new Error("発行済・取消の仕様書は編集できません");
    }
    await query(
      `UPDATE specifications SET construction_scope = $1, materials = $2, method = $3, notes = $4, warranty = $5,
        updated_at = $6 WHERE id = $7`,
      [
        input.constructionScope ?? null,
        input.materials ?? null,
        input.method ?? null,
        input.notes ?? null,
        input.warranty ?? null,
        now,
        existing.id,
      ]
    );
    return (await getSpecification(existing.id))!;
  }
  const id = generateId();
  await query(
    `INSERT INTO specifications (id, tenant_id, estimate_id, project_id, construction_scope, materials,
      method, notes, warranty, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '作成中', $10, $11)`,
    [
      id,
      tenantId,
      input.estimateId,
      input.projectId,
      input.constructionScope ?? null,
      input.materials ?? null,
      input.method ?? null,
      input.notes ?? null,
      input.warranty ?? null,
      now,
      now,
    ]
  );
  return (await getSpecification(id))!;
}

export async function publishSpecification(id: string): Promise<Specification> {
  const now = nowIso();
  await query("UPDATE specifications SET status = '発行済', updated_at = $1 WHERE id = $2", [now, id]);
  return (await getSpecification(id))!;
}

export async function cancelSpecification(id: string): Promise<Specification> {
  const now = nowIso();
  await query("UPDATE specifications SET status = '取消', updated_at = $1 WHERE id = $2", [now, id]);
  return (await getSpecification(id))!;
}
