export const DEFAULT_HOUSEHOLD_ID =
  process.env.DEFAULT_HOUSEHOLD_ID ?? "00000000-0000-0000-0000-000000000001"

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}
