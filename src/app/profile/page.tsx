import { CustomerProtectedPage } from '@/components/auth/protected-page'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <CustomerProtectedPage>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Profile</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <p className="mt-1 text-sm text-gray-900">
                  {profile?.full_name || 'Not provided'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Credit Balance</label>
                <p className="mt-1 text-sm text-gray-900">
                  ${profile?.credit_balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Type</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {profile?.role || 'customer'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Member Since</label>
                <p className="mt-1 text-sm text-gray-900">
                  {profile?.created_at 
                    ? new Date(profile.created_at).toLocaleDateString()
                    : 'Unknown'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerProtectedPage>
  )
} 