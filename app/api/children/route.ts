import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/env"
import { CHILD_COLOR_OPTIONS } from "@/lib/child-colors"
import { mapChildRow } from "@/lib/db-mappers"
import { addMockChild, getMockChildren } from "@/lib/mock-store"
import { getSupabaseAdmin } from "@/lib/supabase/server"

const colorValues = CHILD_COLOR_OPTIONS.map((c) => c.value)

const createSchema = z.object({
  name: z.string().min(1, "名前を入力してください").max(20),
  grade: z.string().min(1, "学年を入力してください").max(30),
  color: z
    .string()
    .refine(
      (v) => (colorValues as readonly string[]).includes(v),
      "表示色を選択してください"
    ),
})

async function ensureHousehold(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  await supabase.from("households").upsert(
    { id: DEFAULT_HOUSEHOLD_ID, name: "わが家" },
    { onConflict: "id" }
  )
}

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

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力内容が不正です", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { name, grade, color } = parsed.data
  const supabase = getSupabaseAdmin()

  if (!supabase) {
    const child = addMockChild({ name, grade, color })
    return NextResponse.json({ child, source: "mock" }, { status: 201 })
  }

  await ensureHousehold(supabase)

  const { count } = await supabase
    .from("children")
    .select("*", { count: "exact", head: true })
    .eq("household_id", DEFAULT_HOUSEHOLD_ID)

  const { data, error } = await supabase
    .from("children")
    .insert({
      household_id: DEFAULT_HOUSEHOLD_ID,
      name,
      grade,
      color,
      sort_order: (count ?? 0) + 1,
    })
    .select("id, name, grade, color")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { child: mapChildRow(data), source: "supabase" },
    { status: 201 }
  )
}
