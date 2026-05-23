import type { AIProcessingResult, ChildContext } from "@/lib/ai-processing"
import type { Child, Printout, PrintoutCategory } from "@/lib/types"

export async function fetchChildren(): Promise<Child[]> {
  const res = await fetch("/api/children", { cache: "no-store" })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "お子さん一覧の取得に失敗しました")
  }
  const data = await res.json()
  return data.children as Child[]
}

export async function createChild(payload: {
  name: string
  grade: string
  color: string
}): Promise<Child> {
  const res = await fetch("/api/children", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error ?? "登録に失敗しました")
  }
  if (!data.child?.id) {
    throw new Error("登録レスポンスが不正です")
  }
  return data.child as Child
}

export async function deleteChild(id: string): Promise<void> {
  const res = await fetch(`/api/children/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "削除に失敗しました")
  }
}

export async function fetchPrintouts(): Promise<Printout[]> {
  const res = await fetch("/api/printouts", { cache: "no-store" })
  if (!res.ok) throw new Error("プリント一覧の取得に失敗しました")
  const data = await res.json()
  return data.printouts as Printout[]
}

export async function createPrintout(payload: {
  childId: string
  title: string
  category: PrintoutCategory
  submissionItem?: string
  deadline?: string
  eventDate?: string
  eventTime?: string
  parentPreparation?: string
  summary?: string
  notes?: string
}): Promise<Printout> {
  const res = await fetch("/api/printouts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("保存に失敗しました")
  const data = await res.json()
  return data.printout as Printout
}

export async function patchPrintout(
  id: string,
  patch: {
    childId?: string
    title?: string
    category?: PrintoutCategory
    submissionItem?: string
    deadline?: string
    eventDate?: string
    eventTime?: string
    parentPreparation?: string
    summary?: string
    notes?: string
    status?: Printout["status"]
    pinned?: boolean
  }
): Promise<Printout> {
  const res = await fetch(`/api/printouts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error ?? "更新に失敗しました")
  }
  return data.printout as Printout
}

export async function deletePrintout(id: string): Promise<void> {
  const res = await fetch(`/api/printouts/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "削除に失敗しました")
  }
}

export type AnalyzePrintImageResponse = {
  result: AIProcessingResult
  warning?: string
}

export async function analyzePrintImage(
  file: File,
  children: ChildContext[]
): Promise<AnalyzePrintImageResponse> {
  const formData = new FormData()
  formData.append("image", file)
  formData.append("children", JSON.stringify(children))

  const res = await fetch("/api/scan/analyze", { method: "POST", body: formData })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error ?? "AI解析に失敗しました")
  }
  return {
    result: data.result as AIProcessingResult,
    warning: typeof data.warning === "string" ? data.warning : undefined,
  }
}
