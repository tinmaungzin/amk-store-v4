'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Trash2,
  Search,
  Copy,
  RefreshCw,
  AlertTriangle,
  Eye,
  Package,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface GameCode {
  id: string
  code: string
  is_sold: boolean
  sold_at: string | null
  created_at: string
  order_id: string | null
}

interface GameCodesViewerProps {
  isOpen: boolean
  onClose: () => void
  productId: string | null
  productName: string | null
  onSuccess?: () => void
}

/**
 * Game Codes Viewer Component
 * Displays all game codes for a product with delete functionality
 */
export function GameCodesViewer({
  isOpen,
  onClose,
  productId,
  productName,
  onSuccess
}: GameCodesViewerProps) {
  const [codes, setCodes] = useState<GameCode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteCodeId, setDeleteCodeId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    sold: 0
  })

  /**
   * Fetch game codes for the product
   */
  const fetchGameCodes = async () => {
    if (!productId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/products/${productId}/codes`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setCodes(data.codes || [])
        setStats({
          total: data.total || 0,
          available: data.available || 0,
          sold: data.sold || 0
        })
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to fetch game codes')
      }
    } catch (error) {
      console.error('Error fetching game codes:', error)
      toast.error('Failed to load game codes')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle game code deletion
   */
  const handleDeleteCode = async (codeId: string) => {
    if (!productId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/products/${productId}/codes?codeId=${codeId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast.success('Game code deleted successfully')
        await fetchGameCodes() // Refresh the list
        onSuccess?.() // Notify parent to refresh product stats
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete game code')
      }
    } catch (error) {
      console.error('Error deleting game code:', error)
      toast.error('Failed to delete game code')
    } finally {
      setIsDeleting(false)
      setDeleteCodeId(null)
    }
  }

  /**
   * Copy code to clipboard
   */
  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Code copied to clipboard')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error('Failed to copy code')
    }
  }

  // Filter codes based on search term
  const filteredCodes = codes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Load codes when dialog opens
  useEffect(() => {
    if (isOpen && productId) {
      fetchGameCodes()
      setSearchTerm('')
    }
  }, [isOpen, productId])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Game Codes - {productName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Codes</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Available</p>
                    <p className="text-2xl font-bold text-green-900">{stats.available}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Sold</p>
                    <p className="text-2xl font-bold text-red-900">{stats.sold}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={fetchGameCodes}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Codes Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading game codes...</p>
                  </div>
                </div>
              ) : filteredCodes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Sold Date</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCodes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              {code.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(code.code)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={code.is_sold ? "destructive" : "default"}
                          >
                            {code.is_sold ? "Sold" : "Available"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(code.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {code.sold_at ? new Date(code.sold_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {!code.is_sold && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteCodeId(code.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No codes found' : 'No game codes yet'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search terms.'
                      : 'Upload game codes using the bulk upload feature.'
                    }
                  </p>
                  {!searchTerm && (
                    <Button variant="outline" onClick={onClose}>
                      Close and Upload Codes
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Results Summary */}
            {searchTerm && (
              <div className="text-sm text-gray-600">
                Showing {filteredCodes.length} of {codes.length} codes
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCodeId} onOpenChange={(open) => !open && setDeleteCodeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete Game Code
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this game code? This action cannot be undone.
              Only unsold codes can be deleted to maintain order integrity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCodeId && handleDeleteCode(deleteCodeId)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Delete Code
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 