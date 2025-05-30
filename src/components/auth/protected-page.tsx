import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type Role = Database['public']['Tables']['profiles']['Row']['role']

interface ProtectedPageProps {
  children: React.ReactNode
  requiredRole?: Role | Role[]
  redirectTo?: string
}

/**
 * Server component that protects pages based on authentication and role requirements.
 * Redirects unauthenticated users to login and unauthorized users to home.
 * @param children - The content to render if user is authorized
 * @param requiredRole - Role(s) required to access the page
 * @param redirectTo - Custom redirect path for unauthenticated users
 */
export async function ProtectedPage({ 
  children, 
  requiredRole,
  redirectTo = '/login' 
}: ProtectedPageProps) {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(redirectTo)
  }

  // If role is required, check user's role
  if (requiredRole) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      redirect('/')
    }

    // Check if user has required role
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.includes(profile.role)
      : profile.role === requiredRole

    if (!hasRequiredRole) {
      redirect('/')
    }
  }

  return <>{children}</>
}

/**
 * Helper component for admin-only pages.
 */
export async function AdminProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage requiredRole={['admin', 'super_admin']}>
      {children}
    </ProtectedPage>
  )
}

/**
 * Helper component for customer pages (any authenticated user).
 */
export async function CustomerProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage>
      {children}
    </ProtectedPage>
  )
} 