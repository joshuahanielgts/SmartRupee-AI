import React, { useCallback, useState, useRef } from 'react'
import { Upload, FileImage, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { parseReceiptImage, ReceiptParseResult } from '@/services/ai'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'react-toastify'

interface ReceiptScannerProps {
  onParsed: (result: ReceiptParseResult, receiptId: string | null) => void
  onClose: () => void
}

type ScanState = 'idle' | 'uploading' | 'parsing' | 'done' | 'error'

export default function ReceiptScanner({ onParsed, onClose }: ReceiptScannerProps) {
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parseResult, setParseResult] = useState<ReceiptParseResult | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum 10MB.')
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setScanState('uploading')
    setErrorMessage(null)

    try {
      setScanState('parsing')
      const response = await parseReceiptImage(file)
      setParseResult(response.parsed)
      setReceiptId(response.receipt_id)
      setScanState('done')
      toast.success(`Receipt parsed! Vendor: ${response.parsed.vendor}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to parse receipt'
      setErrorMessage(message)
      setScanState('error')
      toast.error(message)
    }
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [handleFile])

  const handleUseResult = () => {
    if (parseResult) {
      onParsed(parseResult, receiptId)
    }
  }

  const handleReset = () => {
    setScanState('idle')
    setPreview(null)
    setFileName(null)
    setParseResult(null)
    setReceiptId(null)
    setErrorMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-black/90 border border-white/10 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <FileImage className="w-6 h-6 text-purple-400" />
            <h3 className="text-2xl font-bold text-white">Scan Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Close receipt scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Area */}
          {scanState === 'idle' && (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragActive
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/20 hover:border-white/40 hover:bg-white/5'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={handleInputChange}
                className="hidden"
              />
              <Upload className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
              <p className="text-neutral-300 font-medium mb-1">
                Drop your receipt here or click to browse
              </p>
              <p className="text-neutral-500 text-sm">
                Supports JPEG, PNG, WebP &bull; Max 10MB
              </p>
            </div>
          )}

          {/* Uploading / Parsing State */}
          {(scanState === 'uploading' || scanState === 'parsing') && (
            <div className="text-center py-8">
              <div className="relative mx-auto w-20 h-20 mb-6">
                {preview && (
                  <img
                    src={preview}
                    alt="Receipt preview"
                    className="w-20 h-20 rounded-lg object-cover opacity-50"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
              </div>
              <p className="text-neutral-300 font-medium">
                {scanState === 'uploading' ? 'Uploading receipt...' : 'AI is analyzing your receipt...'}
              </p>
              <p className="text-neutral-500 text-sm mt-1">
                {fileName}
              </p>
            </div>
          )}

          {/* Error State */}
          {scanState === 'error' && (
            <div className="text-center py-6">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 font-medium mb-2">Failed to parse receipt</p>
              <p className="text-neutral-500 text-sm mb-6">{errorMessage}</p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-white/10 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/15 rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Success State — Parsed Result Preview */}
          {scanState === 'done' && parseResult && (
            <div className="space-y-4">
              {/* Preview Row */}
              <div className="flex items-start space-x-4">
                {preview && (
                  <img
                    src={preview}
                    alt="Receipt"
                    className="w-20 h-20 rounded-lg object-cover border border-white/10 flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-green-400 font-medium text-sm">Parsed successfully</p>
                  </div>
                  <p className="text-neutral-500 text-xs truncate">{fileName}</p>
                  <p className="text-neutral-500 text-xs mt-1">
                    Confidence: {Math.round(parseResult.confidence * 100)}%
                  </p>
                </div>
              </div>

              {/* Parsed Fields */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 text-sm">Vendor</span>
                  <span className="text-white font-medium">{parseResult.vendor}</span>
                </div>
                <div className="border-t border-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 text-sm">Total</span>
                  <span className="text-white font-bold text-lg">
                    {formatCurrency(parseResult.total)}
                  </span>
                </div>
                <div className="border-t border-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 text-sm">Date</span>
                  <span className="text-white font-medium">{parseResult.date}</span>
                </div>
                <div className="border-t border-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 text-sm">Category</span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                    {parseResult.suggested_category}
                  </span>
                </div>

                {/* Line Items */}
                {parseResult.line_items.length > 0 && (
                  <>
                    <div className="border-t border-white/5" />
                    <div>
                      <span className="text-neutral-400 text-sm block mb-2">Items</span>
                      <div className="space-y-1">
                        {parseResult.line_items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-neutral-300 truncate mr-4">{item.description}</span>
                            <span className="text-neutral-400 flex-shrink-0">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  Scan Another
                </button>
                <button
                  onClick={handleUseResult}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition"
                >
                  Use This Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
