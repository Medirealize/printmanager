export function isGeminiQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  const status =
    error && typeof error === "object" && "status" in error
      ? (error as { status?: number }).status
      : undefined
  return (
    status === 429 ||
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("Quota exceeded") ||
    message.includes("RESOURCE_EXHAUSTED")
  )
}

export function isGeminiAuthError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  const status =
    error && typeof error === "object" && "status" in error
      ? (error as { status?: number }).status
      : undefined
  return (
    status === 403 ||
    message.includes("API key not valid") ||
    message.includes("API_KEY_INVALID") ||
    message.includes("PERMISSION_DENIED")
  )
}

/** ユーザー向けの短いメッセージ（JSONは含めない） */
export function formatGeminiError(error: unknown): string {
  if (isGeminiQuotaError(error)) {
    return "Gemini API の利用上限に達しました。しばらく時間をおいて再試行するか、内容を手動で入力してください。"
  }
  if (isGeminiAuthError(error)) {
    return "Gemini API キーが無効です。Google AI Studio でキーを確認し、Vercel / .env.local を更新してください。"
  }
  if (error instanceof Error && error.message.length < 200) {
    return error.message
  }
  return "AI解析に失敗しました。もう一度お試しください。"
}

export const GEMINI_QUOTA_FALLBACK_WARNING =
  "Gemini API の利用上限のため、サンプルデータを表示しています。内容を確認・修正してから保存してください。"
