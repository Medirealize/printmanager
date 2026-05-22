export const DEFAULT_HOUSEHOLD_ID =
  process.env.DEFAULT_HOUSEHOLD_ID ?? "00000000-0000-0000-0000-000000000001"

const PLACEHOLDER_PATTERNS = [
  "your-project",
  "your-anon-key",
  "your-service-role-key",
  "example.com",
]

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true
  const lower = value.toLowerCase()
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p))
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false
  if (isPlaceholder(url) || isPlaceholder(key)) return false
  if (!url.includes("supabase.co")) return false
  return true
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}
