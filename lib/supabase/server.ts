import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { isSupabaseConfigured } from "@/lib/env"

let adminClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
  }
  return adminClient
}
