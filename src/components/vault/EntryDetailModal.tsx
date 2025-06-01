import {format} from 'date-fns'
import {Calendar, Copy, Download, ExternalLink, Eye, EyeOff, FileText, Hash, Link as LinkIcon, Tag} from 'lucide-react'
import {useCallback, useState} from 'react'
import {toast} from 'sonner'

import {Button} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {Label} from '@/components/ui/label'
import {COMMON_MIME_TYPES} from '@/lib/locker/constants'
import { canPreviewFile, downloadFileFromEntry, getFileSizeDisplay,previewFileFromEntry } from '@/lib/locker/fileDownloader'
import useLockerKey from '@/lib/locker/lockerKey'
import type { Entry } from '@/lib/locker/types'

interface EntryDetailModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly entry: Entry | null
}

async function handleCopyToClipboard (text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    toast.error('Failed to copy to clipboard')
  }
}

function getMimeTypeDisplayName(mimeType: string) {
  const entry = Object.entries(COMMON_MIME_TYPES).find(([, value]) => value === mimeType)
  return entry ? entry[0].replace(/_/g, ' ') : mimeType
}

export function EntryDetailModal({open, onOpenChange, entry}: EntryDetailModalProps) {
  const [showContent, setShowContent] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const latestEntry = useLatest(entry)
  const [lockerKey] = useLockerKey()

  const handleToggleContent = useCallback(() => {
    setShowContent(prev => !prev)
  }, [])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      setShowContent(false)
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    }
  }, [onOpenChange, previewUrl])

  const handleDownloadFile = useCallback(async () => {
    if (!latestEntry.current || !lockerKey) {
      toast.error('Unable to download file: missing entry or locker key')
      return
    }

    setIsDownloading(true)
    try {
      const result = await downloadFileFromEntry(latestEntry.current, lockerKey)
      if (result.success) {
        toast.success('File downloaded successfully')
      } else {
        toast.error(result.error || 'Failed to download file')
      }
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download file')
    } finally {
      setIsDownloading(false)
    }
  }, [latestEntry, lockerKey])

  const handlePreviewFile = useCallback(async () => {
    if (!latestEntry.current || !lockerKey) {
      toast.error('Unable to preview file: missing entry or locker key')
      return
    }

    setIsLoadingPreview(true)
    try {
      const result = await previewFileFromEntry(latestEntry.current, lockerKey)
      if (result.success) {
        // Clean up previous preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(result.blobUrl)
      } else {
        toast.error(result.error || 'Failed to preview file')
      }
    } catch (error) {
      console.error('Preview failed:', error)
      toast.error('Failed to preview file')
    } finally {
      setIsLoadingPreview(false)
    }
  }, [latestEntry, lockerKey, previewUrl])

  const handleCopyName = useCallback(() => {
    if (latestEntry.current) {
      handleCopyToClipboard(latestEntry.current.name, 'Name')
    }
  }, [])

  const handleCopyContent = useCallback(() => {
    if (latestEntry.current) {
      handleCopyToClipboard(latestEntry.current.content, 'Content')
    }
  }, [])

  const handleCopyHash = useCallback(() => {
    if (latestEntry.current) {
      handleCopyToClipboard(latestEntry.current.hash, 'Hash')
    }
  }, [])

  const handleCopyLink = useCallback(() => {
    if (latestEntry.current?.link) {
      handleCopyToClipboard(latestEntry.current.link, 'Link')
    }
  }, [])

  const handleCopyImageUrl = useCallback(() => {
    if (latestEntry.current?.image_url) {
      handleCopyToClipboard(latestEntry.current.image_url, 'Image URL')
    }
  }, [])

  const handleCopyEntryId = useCallback(() => {
    if (latestEntry.current) {
      handleCopyToClipboard(latestEntry.current.id, 'Entry ID')
    }
  }, [])

  const handleCopyVaultId = useCallback(() => {
    if (latestEntry.current) {
      handleCopyToClipboard(latestEntry.current.vault_id, 'Vault ID')
    }
  }, [])

  if (!entry) {
    return null
  }

  const isFileEntry = entry.is_file
  const canPreview = isFileEntry && canPreviewFile(entry)
  const fileSize = getFileSizeDisplay(entry)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {entry.name}
            {isFileEntry && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                FILE
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {isFileEntry ? 'File entry details and encrypted content' : 'Entry details and encrypted content'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Actions (only for file entries) */}
          {isFileEntry && (
            <div className="flex gap-2 p-4 bg-muted/50 rounded-lg">
              <Button
                onClick={handleDownloadFile}
                disabled={isDownloading || !lockerKey}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? 'Downloading...' : 'Download File'}
              </Button>
              {canPreview && (
                <Button
                  variant="outline"
                  onClick={handlePreviewFile}
                  disabled={isLoadingPreview || !lockerKey}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {isLoadingPreview ? 'Loading...' : 'Preview'}
                </Button>
              )}
            </div>
          )}

          {/* File Preview */}
          {previewUrl && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">File Preview</Label>
              <div className="border rounded-lg p-4">
                {entry.entry_type?.startsWith('image/') ? (
                  <img
                    src={previewUrl}
                    alt={entry.name}
                    className="max-w-full h-auto max-h-96 mx-auto rounded"
                  />
                ) : entry.entry_type === 'application/pdf' ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-96 border rounded"
                    title={entry.name}
                  />
                ) : entry.entry_type?.startsWith('text/') || entry.entry_type === 'application/json' ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-64 border rounded"
                    title={entry.name}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2" />
                    <p>Preview not available for this file type</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-2 mb-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Name</Label>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded-md">
                  {entry.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyName}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {entry.description && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Description</Label>
                <p className="text-sm bg-muted px-3 py-2 rounded-md">
                  {entry.description}
                </p>
              </div>
            )}

            {entry.entry_type && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">MIME Type</Label>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                    {getMimeTypeDisplayName(entry.entry_type)} ({entry.entry_type})
                  </span>
                </div>
              </div>
            )}

            {/* File-specific information */}
            {isFileEntry && (
              <>
                {entry.filename && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Original Filename</Label>
                    <span className="text-sm font-mono bg-muted px-3 py-2 rounded-md block">
                      {entry.filename}
                    </span>
                  </div>
                )}
                {fileSize && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">File Size</Label>
                    <span className="text-sm bg-muted px-3 py-2 rounded-md block">
                      {fileSize}
                    </span>
                  </div>
                )}
                {entry.walrus_blob_id && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Storage</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        WALRUS BLOB
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {entry.walrus_blob_id}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Content Section */}
          <div className="space-y-2 mb-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                {isFileEntry ? 'Encrypted File Content' : 'Content'}
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleContent}
                className="flex items-center gap-2"
              >
                {showContent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showContent ? 'Hide' : 'Show'} Content
              </Button>
            </div>
            {showContent ? (
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    className="w-full h-32 p-3 text-sm font-mono bg-muted border rounded-md resize-none"
                    value={entry.content}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleCopyContent}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {isFileEntry && (
                  <p className="text-xs text-muted-foreground">
                    This is the encrypted file content. Use the download button to decrypt and save the original file.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-muted px-3 py-8 rounded-md text-center">
                <Eye className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Content is hidden for security. Click "Show Content" to reveal.
                </p>
              </div>
            )}
            <Label className="text-sm font-semibold">Content Hash</Label>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-xs font-mono bg-muted px-3 py-2 rounded-md break-all">
                {entry.hash}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyHash}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="space-y-1 mb-2">
              <Label className="text-sm font-semibold">Tags</Label>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Link */}
          {entry.link && (
            <div className="space-y-1 mb-2">
              <Label className="text-sm font-semibold">Related Link</Label>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <a
                  href={entry.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-primary hover:underline truncate"
                >
                  {entry.link}
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={entry.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div className="space-y-1 mb-2">
              <Label className="text-sm font-semibold">Notes</Label>
              <div className="bg-muted px-3 py-2 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
              </div>
            </div>
          )}

          {/* Images */}
          {entry.image_url && (
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Image</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <img
                        src={entry.image_url}
                        alt={entry.name}
                        className="w-full h-32 object-cover rounded-md border"
                        loading="lazy"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleCopyImageUrl}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-semibold">Metadata</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Created</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(entry.created_at), 'PPP p')}</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Last Updated</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(entry.updated_at), 'PPP p')}</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Entry ID</Label>
                <div className="relative">
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded break-all block">
                    {entry.id}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-10"
                    onClick={handleCopyEntryId}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1"
                    asChild
                  >
                    <a
                      href={`https://suiscan.xyz/testnet/object/${entry.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Vault ID</Label>
                {/* <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">
                    {entry.vault_id}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyVaultId}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div> */}
                <div className="relative">
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded break-all block">
                    {entry.vault_id}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1"
                    onClick={handleCopyEntryId}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
