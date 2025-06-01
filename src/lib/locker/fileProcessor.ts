import type { useSuiClient, useWallet } from '@suiet/wallet-kit'

import { FILE_UPLOAD_CONSTANTS } from './constants'
import { type FileProcessingResult } from './types'
import {
  encryptFileContent,
  fileToArrayBuffer,
  getFileMimeType
} from './utils'
import { uploadToWalrus } from './walrusService'

/**
 * Process a file for entry storage: encrypt, upload to Walrus
 */
export async function processFileForEntry(
  file: File,
  lockerKey: string,
  wallet: ReturnType<typeof useWallet>,
  suiClient: ReturnType<typeof useSuiClient>
): Promise<FileProcessingResult> {
  // Validate file type
  const mimeType = getFileMimeType(file)
  if (!FILE_UPLOAD_CONSTANTS.ACCEPTED_FILE_TYPES.includes(mimeType)) {
    throw new Error(`File type ${mimeType} is not supported`)
  }

  try {
    // Convert file to ArrayBuffer
    const fileBuffer = await fileToArrayBuffer(file)

    // Encrypt the file content
    const encryptedContent = await encryptFileContent(fileBuffer, lockerKey)

    // Always upload to Walrus
    let walrusBlobId: string | undefined
    let finalContent = encryptedContent

    try {
      // Upload to Walrus and store only the blob ID in content
      const walrusResponse = await uploadToWalrus(encryptedContent, wallet, suiClient)
      walrusBlobId = walrusResponse.blobId
      finalContent = walrusBlobId // Store only the blob ID
    } catch (walrusError) {
      console.warn('Failed to upload to Walrus, storing content directly:', walrusError)
      // Fallback to storing encrypted content directly if Walrus fails
      // In production, you might want to fail the upload instead
    }

    return {
      encryptedContent: finalContent,
      filename: file.name,
      mimeType,
      fileSize: file.size,
      shouldUseWalrus: true, // Always true now
      walrusBlobId,
    }
  } catch (error) {
    console.error('File processing failed:', error)
    throw new Error(
      error instanceof Error
        ? `File processing failed: ${error.message}`
        : 'Unknown error during file processing'
    )
  }
}

/**
 * Validate file before processing
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check if file is empty
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty'
    }
  }

  // Check file type
  const mimeType = getFileMimeType(file)
  if (!FILE_UPLOAD_CONSTANTS.ACCEPTED_FILE_TYPES.includes(mimeType)) {
    return {
      isValid: false,
      error: `File type ${mimeType} is not supported`
    }
  }

  return { isValid: true }
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / k**i).toFixed(2))} ${sizes[i]}`
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  return lastDotIndex >= 0 ? filename.slice(lastDotIndex + 1).toLowerCase() : ''
}

/**
 * Generate a download filename for an entry
 */
export function generateDownloadFilename(entry: { filename?: string | null; name: string }): string {
  if (entry.filename) {
    return entry.filename
  }

  // Fallback to sanitized name with a generic extension
  const sanitizedName = entry.name.replace(/[^\w\s-]/g, '')
  return `${sanitizedName}.bin`
}
