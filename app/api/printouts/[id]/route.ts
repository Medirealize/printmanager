import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { mapPrintoutRow } from "@/lib/db-mappers"
import { updateMockPrintout } from "@/lib/mock-store"
import { getSupabaseAdmin } from "@/lib/supabase/server"

const patchSchema = z.object({
  status: z.enum(["pending", "completed"]).optional(),
  pinned: z.boolean().optional(),
})

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
    const printout = updateMockPrintout(id, parsed.data)
    if (!printout) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 })
    }
    return NextResponse.json({ printout, source: "mock" })
  }

  const { data, error } = await supabase
    .from("printouts")
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ printout: mapPrintoutRow(data), source: "supabase" })
}
