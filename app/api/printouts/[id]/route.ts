import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { mapPrintoutRow } from "@/lib/db-mappers"
import { deleteMockPrintout, updateMockPrintout } from "@/lib/mock-store"
import { formatSupabaseError } from "@/lib/supabase/errors"
import { getSupabaseAdmin } from "@/lib/supabase/server"

const patchSchema = z.object({
  childId: z.string().min(1).optional(),
  title: z.string().min(1).max(100).optional(),
  category: z.enum(["todo", "event", "info"]).optional(),
  submissionItem: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  eventDate: z.string().optional().nullable(),
  eventTime: z.string().optional().nullable(),
  parentPreparation: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["pending", "completed"]).optional(),
  pinned: z.boolean().optional(),
})

function buildDbUpdate(data: z.infer<typeof patchSchema>) {
  const category = data.category
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (data.childId !== undefined) update.child_id = data.childId
  if (data.title !== undefined) update.title = data.title
  if (data.category !== undefined) update.category = data.category
  if (data.status !== undefined) update.status = data.status
  if (data.pinned !== undefined) update.pinned = data.pinned
  if (data.notes !== undefined) update.notes = data.notes ?? null
  if (data.submissionItem !== undefined)
    update.submission_item = data.submissionItem ?? null
  if (data.deadline !== undefined) update.deadline = data.deadline ?? null
  if (data.eventDate !== undefined) update.event_date = data.eventDate ?? null
  if (data.eventTime !== undefined) update.event_time = data.eventTime ?? null
  if (data.parentPreparation !== undefined)
    update.parent_preparation = data.parentPreparation ?? null
  if (data.summary !== undefined) update.summary = data.summary ?? null

  if (category === "todo") {
    update.event_date = null
    update.event_time = null
    update.parent_preparation = null
    update.summary = null
  } else if (category === "event") {
    update.submission_item = null
    update.deadline = null
    update.summary = null
  } else if (category === "info") {
    update.submission_item = null
    update.deadline = null
    update.event_date = null
    update.event_time = null
    update.parent_preparation = null
  }

  return update
}

function buildMockPatch(data: z.infer<typeof patchSchema>) {
  const patch: Parameters<typeof updateMockPrintout>[1] = {}
  if (data.childId !== undefined) patch.childId = data.childId
  if (data.title !== undefined) patch.title = data.title
  if (data.category !== undefined) patch.category = data.category
  if (data.status !== undefined) patch.status = data.status
  if (data.pinned !== undefined) patch.pinned = data.pinned
  if (data.notes !== undefined) patch.notes = data.notes ?? undefined
  if (data.submissionItem !== undefined)
    patch.submissionItem = data.submissionItem ?? undefined
  if (data.deadline !== undefined) patch.deadline = data.deadline ?? undefined
  if (data.eventDate !== undefined) patch.eventDate = data.eventDate ?? undefined
  if (data.eventTime !== undefined) patch.eventTime = data.eventTime ?? undefined
  if (data.parentPreparation !== undefined)
    patch.parentPreparation = data.parentPreparation ?? undefined
  if (data.summary !== undefined) patch.summary = data.summary ?? undefined
  return patch
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が不正です" }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    const printout = updateMockPrintout(id, buildMockPatch(parsed.data))
    if (!printout) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 })
    }
    return NextResponse.json({ printout, source: "mock" })
  }

  const { data, error } = await supabase
    .from("printouts")
    .update(buildDbUpdate(parsed.data))
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error), code: error.code },
      { status: 500 }
    )
  }

  return NextResponse.json({ printout: mapPrintoutRow(data), source: "supabase" })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabaseAdmin()

  if (!supabase) {
    const ok = deleteMockPrintout(id)
    if (!ok) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 })
    }
    return NextResponse.json({ success: true, source: "mock" })
  }

  const { error } = await supabase.from("printouts").delete().eq("id", id)

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error), code: error.code },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, source: "supabase" })
}
