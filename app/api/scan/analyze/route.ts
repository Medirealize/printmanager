import { NextRequest, NextResponse } from "next/server"
import {
  analyzePrintoutImage,
  GeminiQuotaExceededError,
  normalizeImageMimeType,
} from "@/lib/gemini"
import {
  formatGeminiError,
  GEMINI_QUOTA_FALLBACK_WARNING,
} from "@/lib/gemini-errors"
import { isGeminiConfigured } from "@/lib/env"
import { simulateAIProcessing } from "@/lib/mock-data"
import type { ChildContext } from "@/lib/ai-processing"

export const maxDuration = 60

function assignChildToResult(
  result: Awaited<ReturnType<typeof simulateAIProcessing>>,
  children: ChildContext[]
) {
  if (children.length === 0) return result
  const match =
    children.find((c) => c.id === result.childId) ??
    children.find((c) => c.name === result.childId) ??
    children[0]
  result.childId = match.id
  return result
}

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

    const mimeType = normalizeImageMimeType(file)
    if (
      !mimeType.startsWith("image/") &&
      mimeType !== "image/heic" &&
      mimeType !== "image/heif"
    ) {
      return NextResponse.json(
        { error: "画像ファイル（JPEG / PNG など）を選択してください" },
        { status: 400 }
      )
    }

    if (children.length === 0) {
      return NextResponse.json(
        { error: "先にお子さんを登録してください" },
        { status: 400 }
      )
    }

    if (!isGeminiConfigured()) {
      const result = assignChildToResult(await simulateAIProcessing(), children)
      return NextResponse.json({ result, source: "mock" })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString("base64")

    try {
      const result = await analyzePrintoutImage(base64, mimeType, children)
      return NextResponse.json({ result, source: "gemini" })
    } catch (error) {
      if (error instanceof GeminiQuotaExceededError) {
        const result = assignChildToResult(
          await simulateAIProcessing(),
          children
        )
        return NextResponse.json({
          result,
          source: "mock",
          warning: GEMINI_QUOTA_FALLBACK_WARNING,
        })
      }
      throw error
    }
  } catch (error) {
    console.error("scan/analyze error:", error)
    return NextResponse.json(
      { error: formatGeminiError(error) },
      { status: 500 }
    )
  }
}
