import { GoogleGenerativeAI } from "@google/generative-ai"
import type { AIProcessingResult, ChildContext } from "@/lib/ai-processing"
import type { PrintoutCategory } from "@/lib/types"
import { isGeminiQuotaError } from "@/lib/gemini-errors"

/** クォータの余裕がありやすい順に試行 */
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
].filter((m): m is string => Boolean(m))

function uniqueModels(): string[] {
  return [...new Set(MODEL_CANDIDATES)]
}

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
  "childId": "お子さんのid（必ず上記リストのidを使用）",
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
  try {
    return JSON.parse(jsonStr) as Record<string, unknown>
  } catch {
    throw new Error("AIの応答を解析できませんでした。もう一度お試しください。")
  }
}

function normalizeCategory(value: unknown): PrintoutCategory {
  if (value === "todo" || value === "event" || value === "info") return value
  return "info"
}

function pickChildId(raw: unknown, children: ChildContext[]): string {
  if (typeof raw !== "string" || !raw.trim()) {
    return children[0]?.id ?? ""
  }
  const byId = children.find((c) => c.id === raw)
  if (byId) return byId.id
  const byName = children.find(
    (c) => c.name === raw || raw.includes(c.name) || c.name.includes(raw)
  )
  if (byName) return byName.id
  return children[0]?.id ?? ""
}

function mapParsedToResult(
  parsed: Record<string, unknown>,
  children: ChildContext[]
): AIProcessingResult {
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

export class GeminiQuotaExceededError extends Error {
  constructor() {
    super("GEMINI_QUOTA_EXCEEDED")
    this.name = "GeminiQuotaExceededError"
  }
}

async function analyzeWithModel(
  apiKey: string,
  modelName: string,
  imageBase64: string,
  mimeType: string,
  children: ChildContext[]
): Promise<AIProcessingResult> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: modelName,
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
  return mapParsedToResult(parseGeminiJson(text), children)
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

  const models = uniqueModels()
  let lastError: unknown = null
  let sawQuota = false

  for (const modelName of models) {
    try {
      return await analyzeWithModel(
        apiKey,
        modelName,
        imageBase64,
        mimeType,
        children
      )
    } catch (error) {
      lastError = error
      if (isGeminiQuotaError(error)) {
        sawQuota = true
        continue
      }
      throw error
    }
  }

  if (sawQuota) {
    throw new GeminiQuotaExceededError()
  }
  throw lastError ?? new Error("AI解析に失敗しました")
}

export function normalizeImageMimeType(file: { type: string; name: string }): string {
  if (file.type.startsWith("image/")) return file.type
  const ext = file.name.split(".").pop()?.toLowerCase()
  if (ext === "heic" || ext === "heif") return "image/heic"
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  return "image/jpeg"
}
