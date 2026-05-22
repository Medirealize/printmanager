import { GoogleGenerativeAI } from "@google/generative-ai"
import type { AIProcessingResult, ChildContext } from "@/lib/ai-processing"
import type { PrintoutCategory } from "@/lib/types"

const MODEL = "gemini-2.0-flash"

function buildPrompt(children: ChildContext[]): string {
  const childList = children
    .map((c) => `- id: "${c.id}", 名前: ${c.name}, 学年: ${c.grade}`)
    .join("\n")

  return `あなたは日本の学校から配布されるプリント（お便り）を解析するアシスタントです。
添付画像の学校プリントを読み取り、以下のJSON形式のみで回答してください。Markdownや説明文は不要です。

登録されているお子さん:
${childList}

分類ルール:
- "todo": 提出物・返信が必要（締切あり）
- "event": 保護者参加の行事・イベント（日時あり）
- "info": お知らせ・だより（読むだけ）

JSONスキーマ:
{
  "childId": "お子さんのid（学年・クラス・名前から推測。不明なら最初の子）",
  "title": "短いタイトル",
  "category": "todo" | "event" | "info",
  "submissionItem": "提出物（todoのみ）",
  "deadline": "YYYY-MM-DD（todoのみ、不明ならnull）",
  "eventDate": "YYYY-MM-DD（eventのみ）",
  "eventTime": "例: 10:00〜12:00（eventのみ）",
  "parentPreparation": "親の持ち物・準備（eventのみ）",
  "summary": "概要（infoのみ）",
  "notes": "補足メモ",
  "confidence": 0.0〜1.0
}

日付は今日以降で合理的な値にしてください。読み取れない項目はnullにしてください。`
}

function parseGeminiJson(text: string): Record<string, unknown> {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = fenced ? fenced[1].trim() : trimmed
  return JSON.parse(jsonStr) as Record<string, unknown>
}

function normalizeCategory(value: unknown): PrintoutCategory {
  if (value === "todo" || value === "event" || value === "info") return value
  return "info"
}

function pickChildId(
  raw: unknown,
  children: ChildContext[]
): string {
  if (typeof raw === "string" && children.some((c) => c.id === raw)) {
    return raw
  }
  return children[0]?.id ?? ""
}

export async function analyzePrintoutImage(
  imageBase64: string,
  mimeType: string,
  children: ChildContext[]
): Promise<AIProcessingResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY が設定されていません")
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  })

  const result = await model.generateContent([
    { text: buildPrompt(children) },
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ])

  const text = result.response.text()
  const parsed = parseGeminiJson(text)

  const confidence =
    typeof parsed.confidence === "number"
      ? Math.min(1, Math.max(0, parsed.confidence))
      : 0.85

  return {
    childId: pickChildId(parsed.childId, children),
    title: typeof parsed.title === "string" ? parsed.title : "学校プリント",
    category: normalizeCategory(parsed.category),
    submissionItem:
      typeof parsed.submissionItem === "string"
        ? parsed.submissionItem
        : undefined,
    deadline:
      typeof parsed.deadline === "string" ? parsed.deadline : undefined,
    eventDate:
      typeof parsed.eventDate === "string" ? parsed.eventDate : undefined,
    eventTime:
      typeof parsed.eventTime === "string" ? parsed.eventTime : undefined,
    parentPreparation:
      typeof parsed.parentPreparation === "string"
        ? parsed.parentPreparation
        : undefined,
    summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
    notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
    confidence,
  }
}
