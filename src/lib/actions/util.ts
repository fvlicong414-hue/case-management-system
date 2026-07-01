import { redirect } from "next/navigation";

/**
 * Next.js の redirect()/notFound() は内部的に特殊なエラーを throw して
 * 制御フローを実現している。try/catch でこれを誤って「業務エラー」として
 * 捕まえてしまうと、成功時のリダイレクトがエラー扱いになってしまうため、
 * catch ブロックの先頭で必ずこのチェックを行い、該当する場合は re-throw する。
 */
export function rethrowIfNextControlFlowError(error: unknown): void {
  if (
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof (error as any).digest === "string" &&
    ((error as any).digest.startsWith("NEXT_REDIRECT") || (error as any).digest === "NEXT_NOT_FOUND")
  ) {
    throw error;
  }
}

export function errorRedirect(path: string, error: unknown): never {
  rethrowIfNextControlFlowError(error);
  const message = error instanceof Error ? error.message : "エラーが発生しました";
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export function successRedirect(path: string, message: string): never {
  redirect(`${path}?success=${encodeURIComponent(message)}`);
}

export function getStr(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function getStrOrNull(formData: FormData, key: string): string | null {
  const v = getStr(formData, key);
  return v === "" ? null : v;
}

export function getNumber(formData: FormData, key: string, fallback = 0): number {
  const v = formData.get(key);
  if (typeof v !== "string" || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
