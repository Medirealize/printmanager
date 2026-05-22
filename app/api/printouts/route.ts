import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/env"
import { mapPrintoutRow } from "@/lib/db-mappers"
import { addMockPrintout, getMockPrintouts } from "@/lib/mock-store"
import { formatSupabaseError } from "@/lib/supabase/errors"
import { getSupabaseAdmin } from "@/lib/supabase/server"

const createSchema = z.object({
  childId: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(["todo", "event", "info"]),
  submissionItem: z.string().optional(),
  deadline: z.string().optional(),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  parentPreparation: z.string().optional(),
  summary: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET() {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ printouts: getMockPrintouts(), source: "mock" })
  }

  const { data, error } = await supabase
    .from("printouts")
    .select("*")
    .eq("household_id", DEFAULT_HOUSEHOLD_ID)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error), code: error.code },
      { status: 500 }
    )
  }

  return NextResponse.json({
    printouts: (data ?? []).map(mapPrintoutRow),
    source: "supabase",
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力内容が不正です", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const d = parsed.data
  const supabase = getSupabaseAdmin()

  if (!supabase) {
    const printout = addMockPrintout(d)
    return NextResponse.json({ printout, source: "mock" }, { status: 201 })
  }

  const { data, error } = await supabase
    .from("printouts")
    .insert({
      household_id: DEFAULT_HOUSEHOLD_ID,
      child_id: d.childId,
      title: d.title,
      category: d.category,
      submission_item: d.submissionItem ?? null,
      deadline: d.deadline ?? null,
      event_date: d.eventDate ?? null,
      event_time: d.eventTime ?? null,
      parent_preparation: d.parentPreparation ?? null,
      summary: d.summary ?? null,
      notes: d.notes ?? null,
      status: "pending",
      pinned: false,
      created_at: new Date().toISOString().split("T")[0],
    })
    .select("*")
    .single()

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error), code: error.code },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { printout: mapPrintoutRow(data), source: "supabase" },
    { status: 201 }
  )
}
