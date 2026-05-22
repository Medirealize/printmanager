import { NextResponse } from "next/server"
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/env"
import { deleteMockChild } from "@/lib/mock-store"
import { formatSupabaseError } from "@/lib/supabase/errors"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabaseAdmin()

  if (!supabase) {
    const ok = deleteMockChild(id)
    if (!ok) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 })
    }
    return NextResponse.json({ success: true, source: "mock" })
  }

  const { error } = await supabase
    .from("children")
    .delete()
    .eq("id", id)
    .eq("household_id", DEFAULT_HOUSEHOLD_ID)

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error), code: error.code },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, source: "supabase" })
}
