'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  DollarSign, 
  FileText, 
  User, 
  CreditCard,
  Image as ImageIcon,
  File
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface CreditRequestDetail {
  id: string
  amount: number
  payment_method: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  payment_proof_url: string
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
  reviewer_name?: string
}

interface CreditRequestDetailProps {
  requestId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Credit Request Detail Dialog
 * Shows comprehensive details of a credit request including payment proof
 */
export function CreditRequestDetail({ requestId, open, onOpenChange }: CreditRequestDetailProps) {
  const [requestDetail, setRequestDetail] = useState<CreditRequestDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)

  /**
   * Fetch credit request details
   */
  const fetchRequestDetail = async () => {
    if (!requestId) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/credit-requests/${requestId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch request details')
      }

      const data = await response.json()
      setRequestDetail(data)
    } catch (error) {
      console.error('Error fetching request detail:', error)
      toast.error('Failed to load request details')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open && requestId) {
      fetchRequestDetail()
    }
  }, [open, requestId])

  /**
   * Get status display information
   */
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="w-4 h-4" />,
          text: 'Pending Review',
          color: 'text-orange-600'
        }
      case 'approved':
        return {
          variant: 'default' as const,
          icon: <CheckCircle2 className="w-4 h-4" />,
          text: 'Approved',
          color: 'text-green-600'
        }
      case 'rejected':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="w-4 h-4" />,
          text: 'Rejected',
          color: 'text-red-600'
        }
      default:
        return {
          variant: 'secondary' as const,
          icon: <Clock className="w-4 h-4" />,
          text: status,
          color: 'text-gray-600'
        }
    }
  }

  /**
   * Check if payment proof is an image
   */
  const isImageFile = (url: string) => {
    return url.startsWith('data:image/')
  }

  /**
   * Get file type display
   */
  const getFileTypeDisplay = (url: string) => {
    if (url.startsWith('data:image/')) {
      return { type: 'Image', icon: <ImageIcon className="w-4 h-4" /> }
    } else if (url.startsWith('data:application/pdf')) {
      return { type: 'PDF Document', icon: <File className="w-4 h-4" /> }
    } else {
      return { type: 'File', icon: <File className="w-4 h-4" /> }
    }
  }

  if (!requestDetail && !isLoading) {
    return null
  }

  const statusDisplay = requestDetail ? getStatusDisplay(requestDetail.status) : null
  const fileDisplay = requestDetail ? getFileTypeDisplay(requestDetail.payment_proof_url) : null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Credit Request Details</DialogTitle>
            <DialogDescription>
              Review your credit request information and status
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          ) : requestDetail ? (
            <div className="space-y-6">
              {/* Status and Amount */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">${requestDetail.amount.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Credit Request</div>
                  </div>
                </div>
                {statusDisplay && (
                  <Badge variant={statusDisplay.variant} className="gap-2 px-3 py-1">
                    {statusDisplay.icon}
                    {statusDisplay.text}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Request Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Payment Method</span>
                  </div>
                  <p className="text-gray-900 ml-6">{requestDetail.payment_method}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Submitted</span>
                  </div>
                  <p className="text-gray-900 ml-6">
                    {formatDistanceToNow(new Date(requestDetail.created_at), { addSuffix: true })}
                  </p>
                </div>

                {requestDetail.notes && (
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Notes</span>
                    </div>
                    <p className="text-gray-900 ml-6 bg-gray-50 p-3 rounded-lg">
                      {requestDetail.notes}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Payment Proof */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {fileDisplay?.icon}
                  <span className="text-sm font-medium">Payment Proof</span>
                </div>
                <div className="ml-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Type: {fileDisplay?.type}</span>
                  </div>
                  
                  {isImageFile(requestDetail.payment_proof_url) ? (
                    <div className="space-y-2">
                      <img
                        src={requestDetail.payment_proof_url}
                        alt="Payment proof"
                        className="max-w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setIsImageDialogOpen(true)}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsImageDialogOpen(true)}
                        className="gap-2"
                      >
                        <ImageIcon className="w-3 h-3" />
                        View Full Size
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 text-sm">
                        {fileDisplay?.icon}
                        <span>Payment proof file attached</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open(requestDetail.payment_proof_url, '_blank')}
                      >
                        Open File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Information */}
              {requestDetail.status !== 'pending' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Review Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {requestDetail.reviewer_name && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Reviewed By</span>
                          </div>
                          <p className="text-gray-900 ml-6">{requestDetail.reviewer_name}</p>
                        </div>
                      )}

                      {requestDetail.reviewed_at && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Reviewed</span>
                          </div>
                          <p className="text-gray-900 ml-6">
                            {formatDistanceToNow(new Date(requestDetail.reviewed_at), { addSuffix: true })}
                          </p>
                        </div>
                      )}

                      {requestDetail.admin_notes && (
                        <div className="md:col-span-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Admin Notes</span>
                          </div>
                          <p className="text-gray-900 ml-6 bg-gray-50 p-3 rounded-lg border">
                            {requestDetail.admin_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Full Size Image Dialog */}
      {requestDetail && isImageFile(requestDetail.payment_proof_url) && (
        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Payment Proof</DialogTitle>
              <DialogDescription>
                Full size view of your payment proof
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              <img
                src={requestDetail.payment_proof_url}
                alt="Payment proof - full size"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
} 