import { NextRequest, NextResponse } from "next/server"
import { analyzePrintoutImage } from "@/lib/gemini"
import { isGeminiConfigured } from "@/lib/env"
import { simulateAIProcessing } from "@/lib/mock-data"
import type { ChildContext } from "@/lib/ai-processing"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image")
    const childrenRaw = formData.get("children")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "画像ファイルが必要です" },
        { status: 400 }
      )
    }

    let children: ChildContext[] = []
    if (typeof childrenRaw === "string") {
      children = JSON.parse(childrenRaw) as ChildContext[]
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "画像ファイルを選択してください" },
        { status: 400 }
      )
    }

    if (!isGeminiConfigured()) {
      const result = await simulateAIProcessing()
      if (children.length > 0) {
        const match =
          children.find((c) => c.id === result.childId) ?? children[0]
        result.childId = match.id
      }
      return NextResponse.json({ result, source: "mock" })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString("base64")
    const result = await analyzePrintoutImage(
      base64,
      file.type,
      children.length > 0 ? children : [{ id: "1", name: "子ども", grade: "" }]
    )

    return NextResponse.json({ result, source: "gemini" })
  } catch (error) {
    console.error("scan/analyze error:", error)
    const message =
      error instanceof Error ? error.message : "解析に失敗しました"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
