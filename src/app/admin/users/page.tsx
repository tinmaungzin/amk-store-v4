'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, 
  UserPlus, 
  Shield, 
  Ban, 
  CheckCircle2, 
  Eye, 
  RefreshCw,
  AlertTriangle,
  Calendar,
  DollarSign,
  ShoppingCart,
  Search
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'
import { useUser } from '@/hooks/use-user'

interface User {
  id: string
  email: string
  full_name?: string
  credit_balance: number
  role: 'customer' | 'admin' | 'super_admin'
  is_banned: boolean
  created_at: string
  updated_at: string
  last_login?: string
  _count?: {
    orders: number
    credit_requests: number
  }
}

interface UserStats {
  totalUsers: number
  customers: number
  admins: number
  superAdmins: number
  bannedUsers: number
  totalCreditBalance: number
}

interface BanDialogState {
  open: boolean
  user: User | null
  action: 'ban' | 'unban' | null
  reason: string
  isSubmitting: boolean
}

/**
 * Admin Users Management Page
 * Super Admin: Can manage all users including creating other super admins and admins
 * Admin: Can only manage customers
 */
export default function AdminUsersPage() {
  const { user: currentUser } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    customers: 0,
    admins: 0,
    superAdmins: 0,
    bannedUsers: 0,
    totalCreditBalance: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [banDialog, setBanDialog] = useState<BanDialogState>({
    open: false,
    user: null,
    action: null,
    reason: '',
    isSubmitting: false
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // New user form state
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: 'customer' as 'customer' | 'admin' | 'super_admin',
    credit_balance: 0,
    password: ''
  })

  /**
   * Fetch users and statistics
   */
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        role: roleFilter === 'all' ? '' : roleFilter,
        status: statusFilter === 'all' ? '' : statusFilter
      })

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users)
      setUserStats(data.stats)
      setPagination(data.pagination)

    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, searchTerm, roleFilter, statusFilter])

  /**
   * Open ban confirmation dialog
   */
  const openBanDialog = (user: User, action: 'ban' | 'unban') => {
    setBanDialog({
      open: true,
      user,
      action,
      reason: '',
      isSubmitting: false
    })
  }

  /**
   * Close ban dialog
   */
  const closeBanDialog = () => {
    setBanDialog({
      open: false,
      user: null,
      action: null,
      reason: '',
      isSubmitting: false
    })
  }

  /**
   * Handle user ban/unban with confirmation
   */
  const handleBanAction = async () => {
    if (!banDialog.user || !banDialog.action) return

    try {
      setBanDialog(prev => ({ ...prev, isSubmitting: true }))

      const response = await fetch(`/api/admin/users/${banDialog.user.id}/ban`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: banDialog.action,
          reason: banDialog.reason.trim() || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `Failed to ${banDialog.action} user`)
      }

      const actionText = banDialog.action === 'ban' ? 'banned' : 'unbanned'
      toast.success(`User ${actionText} successfully`)
      fetchUsers()
      closeBanDialog()
      
    } catch (error) {
      console.error(`Error ${banDialog.action}ning user:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to ${banDialog.action} user`)
    } finally {
      setBanDialog(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  /**
   * Create new user
   */
  const createUser = async () => {
    try {
      setIsCreating(true)

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newUser)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create user')
      }

      toast.success('User created successfully')
      setShowCreateDialog(false)
      setNewUser({
        email: '',
        full_name: '',
        role: 'customer',
        credit_balance: 0,
        password: ''
      })
      fetchUsers()

    } catch (error) {
      console.error('Error creating user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create user')
    } finally {
      setIsCreating(false)
    }
  }

  /**
   * Get role badge styling
   */
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { variant: 'default' as const, color: 'bg-purple-100 text-purple-700', text: 'Super Admin' }
      case 'admin':
        return { variant: 'secondary' as const, color: 'bg-blue-100 text-blue-700', text: 'Admin' }
      case 'customer':
        return { variant: 'outline' as const, color: 'bg-gray-100 text-gray-700', text: 'Customer' }
      default:
        return { variant: 'outline' as const, color: 'bg-gray-100 text-gray-700', text: role }
    }
  }

  /**
   * Check if current user can manage the target user
   * Super Admin: Can manage ALL users (customers, admins, super_admins) except themselves for destructive actions
   * Admin: Can only manage customers
   */
  const canManageUser = (targetUser: User) => {
    if (!currentUser) return false
    
    // Super admin can manage everyone (customers, admins, other super_admins)
    if (currentUser.role === 'super_admin') {
      return true
    }
    
    // Admin can only manage customers
    if (currentUser.role === 'admin') {
      return targetUser.role === 'customer'
    }
    
    return false
  }

  /**
   * Check if current user can create users with specific role
   */
  const canCreateRole = (role: string) => {
    if (!currentUser) return false
    
    if (currentUser.role === 'super_admin') return true
    if (currentUser.role === 'admin') return role === 'customer'
    
    return false
  }

  if (isLoading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter(user => {
    // Only apply search filter on client side
    // Role and status filters are handled by the API server-side
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchUsers}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {canCreateRole('customer') && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="user@example.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={newUser.role} 
                      onValueChange={(value: 'customer' | 'admin' | 'super_admin') => 
                        setNewUser(prev => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        {canCreateRole('admin') && <SelectItem value="admin">Admin</SelectItem>}
                        {canCreateRole('super_admin') && <SelectItem value="super_admin">Super Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="credit_balance">Initial Credit Balance</Label>
                    <Input
                      id="credit_balance"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newUser.credit_balance}
                      onChange={(e) => setNewUser(prev => ({ ...prev, credit_balance: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={createUser}
                    disabled={isCreating || !newUser.email || !newUser.password}
                    className="flex-1"
                  >
                    {isCreating ? 'Creating...' : 'Create User'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.totalUsers}</p>
              </div>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.customers}</p>
              </div>
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.admins}</p>
              </div>
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Banned Users</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.bannedUsers}</p>
              </div>
              <Ban className="w-5 h-5 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credits</p>
                <p className="text-2xl font-bold text-gray-900">${userStats.totalCreditBalance.toFixed(2)}</p>
              </div>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="super_admin">Super Admins</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Accounts
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-600">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Users will appear here when they register'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const roleBadge = getRoleBadge(user.role)
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.full_name || 'N/A'}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                            {user._count && (
                              <div className="text-xs text-gray-500 mt-1">
                                {user._count.orders} orders • {user._count.credit_requests} credit requests
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleBadge.color}>
                            {roleBadge.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${user.credit_balance.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {user.is_banned ? (
                            <Badge variant="destructive" className="gap-1">
                              <Ban className="w-3 h-3" />
                              Banned
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="gap-1"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Eye className="w-3 h-3" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>User Profile</DialogTitle>
                                  <DialogDescription>
                                    View user details and account information
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {selectedUser && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                                        <p className="text-sm text-gray-900">{selectedUser.full_name || 'Not provided'}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Email</label>
                                        <p className="text-sm text-gray-900">{selectedUser.email}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Role</label>
                                        <div className="mt-1">
                                          <Badge className={getRoleBadge(selectedUser.role).color}>
                                            {getRoleBadge(selectedUser.role).text}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Credit Balance</label>
                                        <p className="text-sm text-gray-900">${selectedUser.credit_balance.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Account Status</label>
                                        <div className="mt-1">
                                          {selectedUser.is_banned ? (
                                            <Badge variant="destructive" className="gap-1">
                                              <Ban className="w-3 h-3" />
                                              Banned
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                                              <CheckCircle2 className="w-3 h-3" />
                                              Active
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Member Since</label>
                                        <p className="text-sm text-gray-900">
                                          {format(new Date(selectedUser.created_at), 'PPP')}
                                        </p>
                                      </div>
                                    </div>

                                    {selectedUser._count && (
                                      <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-3">Account Activity</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="flex items-center gap-2">
                                            <ShoppingCart className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-600">
                                              {selectedUser._count.orders} total orders
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-600">
                                              {selectedUser._count.credit_requests} credit requests
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            {canManageUser(user) && user.id !== currentUser?.id && (
                              <Button
                                variant={user.is_banned ? "outline" : "destructive"}
                                size="sm"
                                onClick={() => openBanDialog(user, user.is_banned ? 'unban' : 'ban')}
                                className="gap-1"
                              >
                                {user.is_banned ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    Unban
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-3 h-3" />
                                    Ban
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ban/Unban Confirmation Dialog */}
      <Dialog open={banDialog.open} onOpenChange={(open) => !open && closeBanDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {banDialog.action === 'ban' ? (
                <>
                  <Ban className="w-5 h-5 text-red-600" />
                  Ban User
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Unban User
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {banDialog.action === 'ban' 
                ? 'This will prevent the user from accessing the platform'
                : 'This will restore the user\'s access to the platform'
              }
            </DialogDescription>
          </DialogHeader>

          {banDialog.user && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium">{banDialog.user.full_name || 'N/A'}</div>
                <div className="text-sm text-gray-600">{banDialog.user.email}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getRoleBadge(banDialog.user.role).color}>
                    {getRoleBadge(banDialog.user.role).text}
                  </Badge>
                  {banDialog.user.is_banned ? (
                    <Badge variant="destructive" className="gap-1">
                      <Ban className="w-3 h-3" />
                      Currently Banned
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                      <CheckCircle2 className="w-3 h-3" />
                      Currently Active
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="ban-reason">
                  {banDialog.action === 'ban' ? 'Reason for ban (optional)' : 'Reason for unban (optional)'}
                </Label>
                <Textarea
                  id="ban-reason"
                  value={banDialog.reason}
                  onChange={(e) => setBanDialog(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={`Enter reason for ${banDialog.action}ning this user...`}
                  className="mt-1"
                  rows={3}
                />
              </div>

              {banDialog.action === 'ban' && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <strong>Warning:</strong> This user will lose access to their account and will not be able to log in or make purchases.
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleBanAction}
                  disabled={banDialog.isSubmitting}
                  variant={banDialog.action === 'ban' ? 'destructive' : 'default'}
                  className="flex-1"
                >
                  {banDialog.isSubmitting 
                    ? (banDialog.action === 'ban' ? 'Banning...' : 'Unbanning...')
                    : (banDialog.action === 'ban' ? 'Ban User' : 'Unban User')
                  }
                </Button>
                <Button
                  variant="outline"
                  onClick={closeBanDialog}
                  disabled={banDialog.isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 