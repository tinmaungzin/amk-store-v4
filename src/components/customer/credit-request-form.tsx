'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  CreditCard, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  DollarSign,
  Loader2,
  X
} from 'lucide-react'

// Credit request validation schema
const creditRequestSchema = z.object({
  amount: z.number()
    .min(5, 'Minimum credit request is $5')
    .max(1000, 'Maximum credit request is $1000'),
  paymentMethod: z.string()
    .min(1, 'Please select a payment method'),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
})

type CreditRequestFormData = z.infer<typeof creditRequestSchema>

interface CreditRequestFormProps {
  onSuccess?: () => void
  userCreditBalance?: number
}

/**
 * Credit Request Form Component
 * Allows customers to request credits by uploading payment proof
 * @param onSuccess - Callback function called after successful submission
 * @param userCreditBalance - Current user's credit balance for display
 */
export function CreditRequestForm({ onSuccess, userCreditBalance = 0 }: CreditRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [submitStep, setSubmitStep] = useState<'form' | 'uploading' | 'success'>('form')

  const form = useForm<CreditRequestFormData>({
    resolver: zodResolver(creditRequestSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: '',
      notes: '',
    },
  })

  /**
   * Handle file selection and preview generation
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select an image (JPEG, PNG, GIF) or PDF file')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  /**
   * Remove selected file
   */
  const removeFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    // Reset file input
    const fileInput = document.getElementById('payment-proof') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  /**
   * Simulate file upload progress
   */
  const simulateUploadProgress = () => {
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)
  }

  /**
   * Handle form submission
   */
  const onSubmit = async (data: CreditRequestFormData) => {
    if (!selectedFile) {
      toast.error('Please upload payment proof')
      return
    }

    setIsLoading(true)
    setSubmitStep('uploading')
    simulateUploadProgress()

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('amount', data.amount.toString())
      formData.append('paymentMethod', data.paymentMethod)
      if (data.notes) formData.append('notes', data.notes)
      formData.append('paymentProof', selectedFile)

      const response = await fetch('/api/credit-requests', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setSubmitStep('success')
        toast.success('Credit request submitted successfully!')
        
        // Reset form after success
        setTimeout(() => {
          form.reset()
          removeFile()
          setSubmitStep('form')
          onSuccess?.()
        }, 3000)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit credit request')
        setSubmitStep('form')
      }
    } catch (error) {
      console.error('Credit request submission error:', error)
      toast.error('Failed to submit credit request. Please try again.')
      setSubmitStep('form')
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  if (submitStep === 'success') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Request Submitted!</h3>
              <p className="text-gray-600 mt-2">
                Your credit request has been submitted successfully. 
                Our team will review it within 24-48 hours.
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              Processing Time: 1-2 Business Days
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (submitStep === 'uploading') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Uploading Payment Proof</h3>
              <p className="text-gray-600 mt-2">
                Please wait while we process your credit request...
              </p>
            </div>
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-gray-500">{Math.round(uploadProgress)}% complete</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Balance Display */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">${userCreditBalance.toFixed(2)}</p>
              </div>
            </div>
            <Badge variant="outline">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Request Credit
          </CardTitle>
          <CardDescription>
            Submit a request to add credits to your account. Upload payment proof for verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Amount Field */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Amount (USD)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="5"
                        max="1000"
                        placeholder="Enter amount"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum: $5.00 | Maximum: $1,000.00
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PayPal">PayPal</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Select how you made the payment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Proof Upload */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Payment Proof <span className="text-red-500">*</span>
                </label>
                
                {!selectedFile ? (
                  <div className="relative">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('payment-proof')?.click()}
                          disabled={isLoading}
                          className="font-medium"
                        >
                          Click to upload payment proof
                        </Button>
                        <p className="text-xs text-gray-500">
                          JPEG, PNG, GIF, or PDF (max 10MB)
                        </p>
                      </div>
                    </div>
                    <input
                      id="payment-proof"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      disabled={isLoading}
                    />
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {filePreview && (
                            <div className="mt-2">
                              <img 
                                src={filePreview} 
                                alt="Payment proof preview" 
                                className="w-32 h-24 object-cover rounded border"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes Field */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information about your payment..."
                        className="min-h-[80px]"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Provide any additional context or information
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Important Notice */}
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Important Notice
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>All credit requests are manually reviewed</li>
                        <li>Processing time: 1-2 business days</li>
                        <li>Ensure payment proof clearly shows transaction details</li>
                        <li>Credits will be added after verification</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !selectedFile}
                size="lg"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Credit Request
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 