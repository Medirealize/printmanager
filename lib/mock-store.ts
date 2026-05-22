import { mockChildren, mockPrintouts } from "@/lib/mock-data"
import { mapChildRow, mapPrintoutRow } from "@/lib/db-mappers"
import type { Child, Printout } from "@/lib/types"

/** Supabase 未設定時のインメモリフォールバック */
let children = mockChildren.map((c) =>
  mapChildRow({ id: c.id, name: c.name, grade: c.grade, color: c.color })
)
let printouts = mockPrintouts.map((p) =>
  mapPrintoutRow({
    id: p.id,
    child_id: p.childId,
    title: p.title,
    category: p.category,
    submission_item: p.submissionItem ?? null,
    deadline: p.deadline ?? null,
    event_date: p.eventDate ?? null,
    event_time: p.eventTime ?? null,
    parent_preparation: p.parentPreparation ?? null,
    summary: p.summary ?? null,
    pinned: p.pinned ?? false,
    created_at: p.createdAt,
    status: p.status,
    notes: p.notes ?? null,
  })
)

export function getMockChildren(): Child[] {
  return [...children]
}

export function getMockPrintouts(): Printout[] {
  return [...printouts]
}

export function addMockPrintout(data: {
  childId: string
  title: string
  category: Printout["category"]
  submissionItem?: string
  deadline?: string
  eventDate?: string
  eventTime?: string
  parentPreparation?: string
  summary?: string
  notes?: string
}): Printout {
  const row = {
    id: `printout-${Date.now()}`,
    child_id: data.childId,
    title: data.title,
    category: data.category,
    submission_item: data.submissionItem ?? null,
    deadline: data.deadline ?? null,
    event_date: data.eventDate ?? null,
    event_time: data.eventTime ?? null,
    parent_preparation: data.parentPreparation ?? null,
    summary: data.summary ?? null,
    pinned: false,
    created_at: new Date().toISOString().split("T")[0],
    status: "pending" as const,
    notes: data.notes ?? null,
  }
  const mapped = mapPrintoutRow(row)
  printouts = [...printouts, mapped]
  return mapped
}

export function updateMockPrintout(
  id: string,
  patch: Partial<Pick<Printout, "status" | "pinned">>
): Printout | null {
  const idx = printouts.findIndex((p) => p.id === id)
  if (idx < 0) return null
  const updated = { ...printouts[idx], ...patch }
  printouts = [...printouts.slice(0, idx), updated, ...printouts.slice(idx + 1)]
  return updated
}
