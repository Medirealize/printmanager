export function formatSupabaseError(error: {
  message?: string
  code?: string
  details?: string
}): string {
  const msg = error.message ?? "データベースエラーが発生しました"

  if (
    msg.includes("schema cache") ||
    msg.includes("Could not find the table") ||
    error.code === "PGRST205"
  ) {
    return "Supabase にテーブルがありません。SQL Editor で supabase/schema.sql を実行してください。"
  }

  if (msg.includes("Invalid API key") || msg.includes("JWT")) {
    return "Supabase の API キーが正しくありません。.env.local を確認してください。"
  }

  return msg
}

export function isSchemaMissingError(error: {
  message?: string
  code?: string
}): boolean {
  const msg = error.message ?? ""
  return (
    msg.includes("schema cache") ||
    msg.includes("Could not find the table") ||
    error.code === "PGRST205"
  )
}
