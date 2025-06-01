import { AlertCircle, CheckCircle2,FileIcon, Upload, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FILE_UPLOAD_CONSTANTS } from '@/lib/locker/constants'
import { formatFileSize, validateFile } from '@/lib/locker/fileProcessor'
import { cn } from '@/utils/ui'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  selectedFile?: File | null
  isProcessing?: boolean
  processingProgress?: number
  error?: string | null
  disabled?: boolean
  className?: string
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  isProcessing = false,
  processingProgress = 0,
  error,
  disabled = false,
  className,
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0 && !disabled) {
        const file = acceptedFiles[0]
        if (file) {
          const validation = validateFile(file)

          if (validation.isValid) {
            onFileSelect(file)
          } else {
            // Handle validation error - could emit this through a callback
            console.error('File validation failed:', validation.error)
          }
        }
      }
      setIsDragActive(false)
    },
    [onFileSelect, disabled]
  )

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => { setIsDragActive(true); },
    onDragLeave: () => { setIsDragActive(false); },
    accept: FILE_UPLOAD_CONSTANTS.ACCEPTED_FILE_TYPES.reduce<Record<string, string[]>>((acc, type) => {
      acc[type] = []
      return acc
    }, {}),
    multiple: false,
    disabled: disabled || isProcessing,
  })

  const handleRemoveFile = useCallback(() => {
    if (!disabled && !isProcessing) {
      onFileRemove()
    }
  }, [onFileRemove, disabled, isProcessing])

  // If a file is selected, show file info
  if (selectedFile) {
    return (
      <div className={cn("w-full", className)}>
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0 mt-1" />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                    {selectedFile.type && (
                      <span className="ml-2">• {selectedFile.type}</span>
                    )}
                  </p>
                </div>

                {!isProcessing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                )}
              </div>

              {/* Processing Progress */}
              {isProcessing && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-xs text-muted-foreground">
                      Processing file...
                    </span>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="mt-3 flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{error}</span>
                </div>
              )}

              {/* Success State */}
              {!isProcessing && !error && (
                <div className="mt-3 flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs">File ready for upload</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // File upload dropzone
  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-muted/50",
          isDragActive && "border-primary bg-primary/5",
          isDragAccept && "border-green-500 bg-green-50",
          isDragReject && "border-destructive bg-destructive/5",
          disabled && "cursor-not-allowed opacity-60",
          error && "border-destructive"
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-2">
          <Upload className={cn(
            "h-8 w-8 text-muted-foreground",
            isDragActive && "text-primary",
            error && "text-destructive"
          )} />

          <div className="text-sm">
            <span className="font-medium">
              {isDragActive ? 'Drop the file here' : 'Choose a file or drag it here'}
            </span>
            <p className="text-muted-foreground mt-1">
              All files will be uploaded to Walrus storage
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="mt-2"
          >
            Browse Files
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs">{error}</span>
          </div>
        )}
      </div>

      {/* Accepted File Types */}
      <div className="mt-2 text-xs text-muted-foreground">
        <p>Supported formats: Images, Documents, Code files, Archives, Media files</p>
      </div>
    </div>
  )
}
