'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  CreditCard, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  RefreshCw, 
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
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
  user: {
    id: string
    email: string
    full_name?: string
    credit_balance: number
  }
  payment_proof_url?: string
}

interface CreditStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  totalAmountRequested: number
  totalAmountApproved: number
}

/**
 * Admin Credits Management Page
 * Allows administrators to review and process credit requests
 */
export default function AdminCreditsPage() {
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([])
  const [creditStats, setCreditStats] = useState<CreditStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalAmountRequested: 0,
    totalAmountApproved: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<CreditRequest | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  /**
   * Fetch credit requests and statistics
   */
  const fetchCreditData = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/admin/credits?page=${pagination.page}&limit=${pagination.limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch credit requests')
      }

      const data = await response.json()
      setCreditRequests(data.requests)
      setCreditStats(data.stats)
      setPagination(data.pagination)

    } catch (error) {
      console.error('Error fetching credit data:', error)
      toast.error('Failed to load credit requests')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCreditData()
  }, [pagination.page])

  /**
   * Process credit request (approve/reject)
   */
  const processRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (!selectedRequest) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/credits/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action,
          admin_notes: adminNotes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to process request')
      }

      toast.success(`Credit request ${action}d successfully`)
      setSelectedRequest(null)
      setAdminNotes('')
      fetchCreditData()

    } catch (error) {
      console.error('Error processing request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process request')
    } finally {
      setIsProcessing(false)
    }
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
          text: 'Pending',
          color: 'text-orange-600'
        }
      case 'approved':
        return {
          variant: 'default' as const,
          icon: <CheckCircle2 className="w-3 h-3" />,
          text: 'Approved',
          color: 'text-green-600'
        }
      case 'rejected':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="w-3 h-3" />,
          text: 'Rejected',
          color: 'text-red-600'
        }
      default:
        return {
          variant: 'secondary' as const,
          icon: <Clock className="w-3 h-3" />,
          text: status,
          color: 'text-gray-600'
        }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credit Management</h1>
          <p className="text-gray-600 mt-1">
            Review and process customer credit requests
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchCreditData}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {creditStats.totalRequests}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Amount Requested</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${creditStats.totalAmountRequested.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Amount Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  ${creditStats.totalAmountApproved.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Credit Requests
          </CardTitle>
          <CardDescription>
            Review and process customer credit requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {creditRequests.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No credit requests found
              </h3>
              <p className="text-gray-600">
                Credit requests will appear here when customers submit them
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
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
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.user.full_name || 'N/A'}</div>
                            <div className="text-sm text-gray-600">{request.user.email}</div>
                            <div className="text-sm text-gray-500">
                              Balance: ${request.user.credit_balance.toFixed(2)}
                            </div>
                          </div>
                        </TableCell>
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
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="gap-1"
                                onClick={() => {
                                  setSelectedRequest(request)
                                  setAdminNotes(request.admin_notes || '')
                                }}
                              >
                                <Eye className="w-3 h-3" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Review Credit Request</DialogTitle>
                                <DialogDescription>
                                  Review request details and approve or reject
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedRequest && (
                                <div className="space-y-6">
                                  {/* Request Details */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Customer</label>
                                      <p className="text-sm text-gray-900">{selectedRequest.user.full_name || 'N/A'}</p>
                                      <p className="text-sm text-gray-600">{selectedRequest.user.email}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Current Balance</label>
                                      <p className="text-sm text-gray-900">${selectedRequest.user.credit_balance.toFixed(2)}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Request Amount</label>
                                      <p className="text-sm text-gray-900">${selectedRequest.amount.toFixed(2)}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Payment Method</label>
                                      <p className="text-sm text-gray-900">{selectedRequest.payment_method}</p>
                                    </div>
                                  </div>

                                  {/* Customer Notes */}
                                  {selectedRequest.notes && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Customer Notes</label>
                                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border mt-1">
                                        {selectedRequest.notes}
                                      </p>
                                    </div>
                                  )}

                                  {/* Payment Proof */}
                                  {selectedRequest.payment_proof_url && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Payment Proof</label>
                                      <div className="mt-2 border rounded-lg overflow-hidden">
                                        {selectedRequest.payment_proof_url.startsWith('data:image') ? (
                                          <img 
                                            src={selectedRequest.payment_proof_url} 
                                            alt="Payment proof" 
                                            className="w-full max-h-64 object-contain"
                                          />
                                        ) : (
                                          <div className="p-4 text-center">
                                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">PDF Document</p>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              className="mt-2"
                                              onClick={() => window.open(selectedRequest.payment_proof_url, '_blank')}
                                            >
                                              View PDF
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Admin Notes */}
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Admin Notes</label>
                                    <Textarea
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      placeholder="Add notes about this request..."
                                      className="mt-1"
                                      rows={3}
                                    />
                                  </div>

                                  {/* Action Buttons */}
                                  {selectedRequest.status === 'pending' && (
                                    <div className="flex gap-3 pt-4 border-t">
                                      <Button
                                        onClick={() => processRequest(selectedRequest.id, 'approve')}
                                        disabled={isProcessing}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Approve Request
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => processRequest(selectedRequest.id, 'reject')}
                                        disabled={isProcessing}
                                        className="flex-1"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject Request
                                      </Button>
                                    </div>
                                  )}

                                  {/* Status Display for processed requests */}
                                  {selectedRequest.status !== 'pending' && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                      <div className="flex items-center gap-2 mb-2">
                                        {getStatusDisplay(selectedRequest.status).icon}
                                        <span className="font-medium">
                                          Request {selectedRequest.status}
                                        </span>
                                      </div>
                                      {selectedRequest.admin_notes && (
                                        <p className="text-sm text-gray-600">
                                          <strong>Admin Notes:</strong> {selectedRequest.admin_notes}
                                        </p>
                                      )}
                                      {selectedRequest.reviewed_at && (
                                        <p className="text-sm text-gray-500 mt-1">
                                          Reviewed {formatDistanceToNow(new Date(selectedRequest.reviewed_at), { addSuffix: true })}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
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
    </div>
  )
} 