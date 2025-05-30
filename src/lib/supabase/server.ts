import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

/**
 * Creates a Supabase server client for use in Server Components, Server Actions, and Route Handlers.
 * This client properly handles session management via cookies.
 * @returns Configured Supabase server client
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        }
      }
    }
  )
}

/**
 * Creates a Supabase server client with admin access for server-side operations.
 * This should only be used for operations that require elevated privileges.
 * @returns Configured Supabase admin client
 */
export async function createAdminClient() {
  const supabase = await createClient()
  
  // Note: For true admin operations, you would use the service role key
  // For now, this returns the regular client but can be extended
  return supabase
} 