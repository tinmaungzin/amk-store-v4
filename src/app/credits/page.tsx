'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  CreditCard, 
  History, 
  Plus, 
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { CreditRequestForm } from '@/components/customer/credit-request-form'
import { CreditRequestDetail } from '@/components/customer/credit-request-detail'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface CreditRequest {
  id: string
  amount: number
  payment_method: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  created_at: string
  reviewed_at?: string
}

interface CreditStats {
  balance: number
  totalSpent: number
  totalAdded: number
  pendingRequests: number
}

/**
 * Customer Credits Page
 * Displays credit balance, request history, and allows new credit requests
 */
export default function CreditsPage() {
  const [creditStats, setCreditStats] = useState<CreditStats>({
    balance: 0,
    totalSpent: 0,
    totalAdded: 0,
    pendingRequests: 0
  })
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  /**
   * Fetch user's total spent from completed orders
   */
  const fetchTotalSpent = async () => {
    try {
      const response = await fetch('/api/orders?limit=1000') // Get all orders to calculate total
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const { orders } = await response.json()
      
      // Calculate total spent from completed orders with credit payment
      const totalSpent = orders
        .filter((order: any) => order.status === 'completed' && order.paymentMethod === 'credit')
        .reduce((sum: number, order: any) => sum + order.totalAmount, 0)

      return totalSpent
    } catch (error) {
      console.error('Error fetching total spent:', error)
      return 0 // Return 0 if there's an error, don't block the rest of the data
    }
  }

  /**
   * Fetch user's credit data and statistics
   */
  const fetchCreditData = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        toast.error('Please log in to view your credits')
        return
      }

      // Get user's credit balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credit_balance')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        toast.error('Failed to load credit balance')
        return
      }

      // Get credit requests
      const response = await fetch(`/api/credit-requests?page=${pagination.page}&limit=${pagination.limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch credit requests')
      }

      const { requests, pagination: newPagination } = await response.json()

      // Calculate statistics
      const pendingRequests = requests.filter((req: CreditRequest) => req.status === 'pending').length
      const approvedRequests = requests.filter((req: CreditRequest) => req.status === 'approved')
      const totalAdded = approvedRequests.reduce((sum: number, req: CreditRequest) => sum + req.amount, 0)

      // Fetch total spent from orders
      const totalSpent = await fetchTotalSpent()

      setCreditStats({
        balance: profile.credit_balance || 0,
        totalSpent,
        totalAdded,
        pendingRequests
      })

      setCreditRequests(requests)
      setPagination(newPagination)

    } catch (error) {
      console.error('Error fetching credit data:', error)
      toast.error('Failed to load credit information')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCreditData()
  }, [pagination.page]) // Re-fetch when page changes

  /**
   * Handle successful credit request submission
   */
  const handleRequestSuccess = () => {
    setIsRequestDialogOpen(false)
    fetchCreditData()
    toast.success('Credit request submitted successfully!')
  }

  /**
   * Handle view request details
   */
  const handleViewRequest = (requestId: string) => {
    setSelectedRequestId(requestId)
    setIsDetailDialogOpen(true)
  }

  /**
   * Get status badge color and icon
   */
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="w-3 h-3" />,
          text: 'Pending'
        }
      case 'approved':
        return {
          variant: 'default' as const,
          icon: <CheckCircle2 className="w-3 h-3" />,
          text: 'Approved'
        }
      case 'rejected':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="w-3 h-3" />,
          text: 'Rejected'
        }
      default:
        return {
          variant: 'secondary' as const,
          icon: <Clock className="w-3 h-3" />,
          text: status
        }
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Credits</h1>
          <p className="text-gray-600 mt-1">
            Manage your account balance and view request history
          </p>
        </div>
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Request Credits
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Credits</DialogTitle>
              <DialogDescription>
                Submit a payment proof to add credits to your account
              </DialogDescription>
            </DialogHeader>
            <CreditRequestForm
              onSuccess={handleRequestSuccess}
              userCreditBalance={creditStats.balance}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Credit Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ${creditStats.balance.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Added</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${creditStats.totalAdded.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${creditStats.totalSpent.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-orange-600">
                  {creditStats.pendingRequests}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Request History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Request History
              </CardTitle>
              <CardDescription>
                Track your credit request submissions and their status
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCreditData}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {creditRequests.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No credit requests yet
              </h3>
              <p className="text-gray-600 mb-4">
                Submit your first credit request to get started
              </p>
              <Button
                onClick={() => setIsRequestDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Request Credits
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditRequests.map((request) => {
                      const statusDisplay = getStatusDisplay(request.status)
                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            ${request.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>{request.payment_method}</TableCell>
                          <TableCell>
                            <Badge variant={statusDisplay.variant} className="gap-1">
                              {statusDisplay.icon}
                              {statusDisplay.text}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => handleViewRequest(request.id)}
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {creditRequests.map((request) => {
                  const statusDisplay = getStatusDisplay(request.status)
                  return (
                    <Card key={request.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-semibold">
                              ${request.amount.toFixed(2)}
                            </div>
                            <Badge variant={statusDisplay.variant} className="gap-1">
                              {statusDisplay.icon}
                              {statusDisplay.text}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div><strong>Payment:</strong> {request.payment_method}</div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full gap-1"
                            onClick={() => handleViewRequest(request.id)}
                          >
                            <Eye className="w-3 h-3" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} requests
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

      {/* Credit Request Detail Dialog */}
      <CreditRequestDetail
        requestId={selectedRequestId}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </div>
  )
} 