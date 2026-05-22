import type { Child, Printout } from "@/lib/types"

export function mapChildRow(row: {
  id: string
  name: string
  grade: string
  color: string
}): Child {
  return {
    id: row.id,
    name: row.name,
    grade: row.grade,
    color: row.color,
  }
}

export function mapPrintoutRow(row: {
  id: string
  child_id: string
  title: string
  category: string
  submission_item: string | null
  deadline: string | null
  event_date: string | null
  event_time: string | null
  parent_preparation: string | null
  summary: string | null
  pinned: boolean
  created_at: string
  status: string
  notes: string | null
}): Printout {
  return {
    id: row.id,
    childId: row.child_id,
    title: row.title,
    category: row.category as Printout["category"],
    submissionItem: row.submission_item ?? undefined,
    deadline: row.deadline ?? undefined,
    eventDate: row.event_date ?? undefined,
    eventTime: row.event_time ?? undefined,
    parentPreparation: row.parent_preparation ?? undefined,
    summary: row.summary ?? undefined,
    pinned: row.pinned,
    createdAt: row.created_at,
    status: row.status as Printout["status"],
    notes: row.notes ?? undefined,
  }
}
