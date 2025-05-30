'use client'

import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface UserNavProps {
  user: User
  profile: Profile | null
}

/**
 * User navigation dropdown component.
 * Shows user profile, credit balance, navigation links, and logout option.
 */
export function UserNav({ user, profile }: UserNavProps) {
  const router = useRouter()
  const supabase = createClient()
  const { signOut } = useUser()

  const handleLogout = async () => {
    try {
      console.log('🔑 Logout initiated')
      
      // Use client-side Supabase logout
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Logout error:', error)
        toast.error('Failed to log out. Please try again.')
        return
      }

      // Also call the UserProvider signOut to clear local state
      await signOut()
      
      console.log('✅ Logout successful, authentication state will update automatically')
      toast.success('Logged out successfully!')
      
      // Redirect to login page
      router.push('/login')
      
    } catch (error) {
      console.error('Unexpected logout error:', error)
      toast.error('Failed to log out. Please try again.')
    }
  }

  // Get user initials for avatar fallback
  const getInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  const userEmail = user.email || ''
  const initials = getInitials(profile?.full_name, userEmail)
  const displayName = profile?.full_name || user.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={displayName || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {profile && (
              <p className="text-xs leading-none text-muted-foreground">
                Credits: ${profile.credit_balance.toFixed(2)}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">Profile</Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/orders" className="cursor-pointer">My Orders</Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/credits" className="cursor-pointer">Credits</Link>
        </DropdownMenuItem>

        {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">Admin Dashboard</Link>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={handleLogout}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 