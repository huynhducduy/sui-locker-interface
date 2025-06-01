import { generateDownloadFilename } from './fileProcessor'
import type { Entry } from './types'
import { decryptFileContent } from './utils'
import { downloadFromWalrus } from './walrusService'

export interface FileDownloadResult {
  success: boolean
  error?: string
}

/**
 * Download and decrypt a file from an entry
 */
export async function downloadFileFromEntry(
  entry: Entry,
  lockerKey: string
): Promise<FileDownloadResult> {
  try {
    if (!entry.is_file) {
      throw new Error('Entry is not a file')
    }

    if (!entry.filename && !entry.name) {
      throw new Error('No filename available for download')
    }

    let encryptedContent: string

    // Check if file is stored in Walrus
    if (entry.walrus_blob_id) {
      try {
        const walrusResponse = await downloadFromWalrus(entry.walrus_blob_id)
        // Convert ArrayBuffer to hex string
        const uint8Array = new Uint8Array(walrusResponse.data)
        encryptedContent = Array.from(uint8Array)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      } catch (walrusError) {
        console.error('Failed to download from Walrus:', walrusError)
        throw new Error('Failed to download file from Walrus storage')
      }
    } else {
      // File content is stored directly in the entry
      encryptedContent = entry.content
    }

    // Decrypt the file content
    const decryptedBuffer = await decryptFileContent(encryptedContent, lockerKey)

    // Create blob and download
    const mimeType = entry.entry_type ?? 'application/octet-stream'
    const blob = new Blob([decryptedBuffer], { type: mimeType })

    // Generate filename
    const filename = generateDownloadFilename({
      filename: entry.filename ?? null,
      name: entry.name
    })

    // Create download link and trigger download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL object
    URL.revokeObjectURL(url)

    return { success: true }
  } catch (error) {
    console.error('File download failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during file download'
    }
  }
}

/**
 * Preview a file from an entry (returns blob URL for preview)
 */
export async function previewFileFromEntry(
  entry: Entry,
  lockerKey: string
): Promise<{ success: true; blobUrl: string; mimeType: string } | { success: false; error: string }> {
  try {
    if (!entry.is_file) {
      throw new Error('Entry is not a file')
    }

    let encryptedContent: string

    // Check if file is stored in Walrus
    if (entry.walrus_blob_id) {
      try {
        const walrusResponse = await downloadFromWalrus(entry.walrus_blob_id)
        // Convert ArrayBuffer to hex string
        const uint8Array = new Uint8Array(walrusResponse.data)
        encryptedContent = Array.from(uint8Array)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      } catch (walrusError) {
        console.error('Failed to download from Walrus:', walrusError)
        throw new Error('Failed to download file from Walrus storage')
      }
    } else {
      // File content is stored directly in the entry
      encryptedContent = entry.content
    }

    // Decrypt the file content
    const decryptedBuffer = await decryptFileContent(encryptedContent, lockerKey)

    // Create blob for preview
    const mimeType = entry.entry_type ?? 'application/octet-stream'
    const blob = new Blob([decryptedBuffer], { type: mimeType })
    const blobUrl = URL.createObjectURL(blob)

    return {
      success: true,
      blobUrl,
      mimeType
    }
  } catch (error) {
    console.error('File preview failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during file preview'
    }
  }
}

/**
 * Check if a file can be previewed in the browser
 */
export function canPreviewFile(entry: Entry): boolean {
  if (!entry.is_file || !entry.entry_type) {
    return false
  }

  const previewableMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'text/plain',
    'text/html',
    'text/markdown',
    'text/css',
    'text/javascript',
    'application/json',
    'application/pdf'
  ]

  return previewableMimeTypes.includes(entry.entry_type)
}

/**
 * Get file size in human readable format
 */
export function getFileSizeDisplay(entry: Entry): string | null {
  if (!entry.is_file || !entry.file_size) {
    return null
  }

  const bytes = entry.file_size
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / k**i).toFixed(2))} ${sizes[i]}`
}
