import { NextResponse } from "next/server"
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/env"
import { mapChildRow } from "@/lib/db-mappers"
import { getMockChildren } from "@/lib/mock-store"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export async function GET() {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ children: getMockChildren(), source: "mock" })
  }

  const { data, error } = await supabase
    .from("children")
    .select("id, name, grade, color")
    .eq("household_id", DEFAULT_HOUSEHOLD_ID)
    .order("sort_order", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    children: (data ?? []).map(mapChildRow),
    source: "supabase",
  })
}
