'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Loader2
} from 'lucide-react'

// Validation schema for bulk upload
const bulkUploadSchema = z.object({
  productId: z.string().min(1, 'Product selection is required'),
  codes: z.string().min(1, 'At least one code is required'),
  method: z.enum(['textarea', 'csv']),
})

type BulkUploadFormData = z.infer<typeof bulkUploadSchema>

interface BulkCodeUploadProps {
  isOpen: boolean
  onClose: () => void
  productId?: string
  productName?: string
  onSuccess: () => void
}

interface UploadResult {
  success: boolean
  added: number
  duplicates: number
  errors: string[]
  totalProcessed: number
}

/**
 * Bulk Game Code Upload Component
 * Allows admins to upload multiple game codes for a product via textarea or CSV file
 * @param isOpen - Dialog open state
 * @param onClose - Close dialog callback
 * @param productId - Pre-selected product ID
 * @param productName - Pre-selected product name for display
 * @param onSuccess - Success callback to refresh parent data
 */
export function BulkCodeUpload({
  isOpen,
  onClose,
  productId,
  productName,
  onSuccess
}: BulkCodeUploadProps) {
  const [uploadMethod, setUploadMethod] = useState<'textarea' | 'csv'>('textarea')
  const [isLoading, setIsLoading] = useState(false)
  const [previewCodes, setPreviewCodes] = useState<string[]>([])
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const form = useForm<BulkUploadFormData>({
    resolver: zodResolver(bulkUploadSchema),
    defaultValues: {
      productId: productId || '',
      codes: '',
      method: uploadMethod,
    },
  })

  // Update form when productId or method changes
  useEffect(() => {
    form.setValue('productId', productId || '')
    form.setValue('method', uploadMethod)
  }, [productId, uploadMethod, form])

  /**
   * Parse codes from text input (textarea or CSV content)
   */
  const parseCodes = (text: string): string[] => {
    return text
      .split(/[\n,;]+/) // Split by newlines, commas, or semicolons
      .map(code => code.trim())
      .filter(code => code.length > 0)
      .filter((code, index, array) => array.indexOf(code) === index) // Remove duplicates
  }

  /**
   * Handle file selection for CSV upload
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast.error('Please select a CSV or TXT file')
      return
    }

    setSelectedFile(file)

    // Read file content
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const codes = parseCodes(content)
      form.setValue('codes', content)
      setPreviewCodes(codes.slice(0, 10)) // Show first 10 for preview
    }
    reader.readAsText(file)
  }

  /**
   * Handle textarea input for code preview
   */
  const handleTextareaChange = (value: string) => {
    const codes = parseCodes(value)
    setPreviewCodes(codes.slice(0, 10)) // Show first 10 for preview
  }

  /**
   * Download sample CSV template
   */
  const downloadSampleCSV = () => {
    const sampleData = `game_code
ABC123-DEF456-GHI789
XYZ987-UVW654-TSR321
QWE123-ASD456-ZXC789
RTY456-FGH789-VBN012`

    const blob = new Blob([sampleData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'game_codes_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Sample CSV template downloaded')
  }

  /**
   * Handle form submission
   */
  const onSubmit = async (data: BulkUploadFormData) => {
    console.log('Form submission started', { data, productId })
    
    if (!productId) {
      toast.error('Product selection is required')
      console.error('Product ID is missing')
      return
    }

    setIsLoading(true)
    setUploadResult(null)

    try {
      const codes = parseCodes(data.codes)
      console.log('Parsed codes:', codes)

      if (codes.length === 0) {
        toast.error('No valid codes found to upload')
        setIsLoading(false)
        return
      }

      console.log('Making API request to:', `/api/admin/products/${productId}/codes/bulk`)
      
      const response = await fetch(`/api/admin/products/${productId}/codes/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          codes,
          method: uploadMethod,
        }),
      })

      console.log('API Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('API Response data:', result)
        setUploadResult(result)

        if (result.success) {
          toast.success(`Successfully uploaded ${result.added} game codes`)
          onSuccess()
        } else {
          toast.error('Upload completed with some errors')
        }
      } else {
        const error = await response.json()
        console.error('API Error:', error)
        toast.error(error.message || 'Failed to upload codes')
      }
    } catch (error) {
      console.error('Bulk upload error:', error)
      toast.error('Failed to upload codes. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Reset form and close dialog
   */
  const handleClose = () => {
    form.reset()
    setPreviewCodes([])
    setUploadResult(null)
    setSelectedFile(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Upload Game Codes
          </DialogTitle>
          <DialogDescription>
            Upload multiple game codes for {productName || 'selected product'} using text input or CSV file
          </DialogDescription>
        </DialogHeader>

        {uploadResult ? (
          // Upload Results Display
          <div className="space-y-4">
            <Card className={`border-2 ${uploadResult.success ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {uploadResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  )}
                  Upload Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{uploadResult.added}</div>
                    <div className="text-sm text-gray-600">Added</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{uploadResult.duplicates}</div>
                    <div className="text-sm text-gray-600">Duplicates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{uploadResult.errors.length}</div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{uploadResult.totalProcessed}</div>
                    <div className="text-sm text-gray-600">Processed</div>
                  </div>
                </div>

                {uploadResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-red-700 mb-2">Errors:</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {uploadResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-100 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setUploadResult(null)
                  form.reset()
                  setPreviewCodes([])
                }}
              >
                Upload More Codes
              </Button>
            </div>
          </div>
        ) : (
          // Upload Form
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Upload Method Tabs */}
              <Tabs
                value={uploadMethod}
                onValueChange={(value) => setUploadMethod(value as 'textarea' | 'csv')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="textarea" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Text Input
                  </TabsTrigger>
                  <TabsTrigger value="csv" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    CSV Upload
                  </TabsTrigger>
                </TabsList>

                {/* Text Area Method */}
                <TabsContent value="textarea" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="codes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game Codes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter game codes, one per line or separated by commas:&#10;ABC123-DEF456-GHI789&#10;XYZ987-UVW654-TSR321&#10;QWE123-ASD456-ZXC789"
                            className="min-h-[150px] font-mono text-sm"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handleTextareaChange(e.target.value)
                            }}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter one code per line or separate multiple codes with commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* CSV Upload Method */}
                <TabsContent value="csv" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="csv-file">Upload CSV File</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <Input
                          id="csv-file"
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileSelect}
                          disabled={isLoading}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={downloadSampleCSV}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Sample
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Upload a CSV or TXT file containing game codes
                      </p>
                    </div>

                    {selectedFile && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">{selectedFile.name}</span>
                            <Badge variant="secondary">{(selectedFile.size / 1024).toFixed(1)} KB</Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null)
                              form.setValue('codes', '')
                              setPreviewCodes([])
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Code Preview */}
              {previewCodes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Preview</CardTitle>
                    <CardDescription>
                      Showing first {Math.min(previewCodes.length, 10)} codes
                      {previewCodes.length > 10 && ` (${parseCodes(form.watch('codes')).length} total)`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {previewCodes.map((code, index) => (
                        <div
                          key={index}
                          className="text-sm font-mono bg-gray-50 p-2 rounded border"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                    {parseCodes(form.watch('codes')).length > 10 && (
                      <p className="text-sm text-gray-600 mt-2">
                        ... and {parseCodes(form.watch('codes')).length - 10} more codes
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || previewCodes.length === 0}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Upload {parseCodes(form.watch('codes')).length} Codes
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
} 