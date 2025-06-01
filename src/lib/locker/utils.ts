export async function encryptContent(content: string, lockerKey: string) {
  // Hash the locker key to ensure it's exactly 256 bits (32 bytes)
  const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(lockerKey))
  const key = await crypto.subtle.importKey('raw', keyHash, 'AES-CBC', false, ['encrypt', 'decrypt'])

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(16))

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    new TextEncoder().encode(content)
  )

  // Prepend IV to encrypted data
  const encryptedWithIV = new Uint8Array([...iv, ...new Uint8Array(encrypted)])
  const encryptedHex = Array.from(encryptedWithIV)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return encryptedHex
}

export async function decryptContent(encrypted: string, lockerKey: string) {
  // Hash the locker key to ensure it's exactly 256 bits (32 bytes)
  const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(lockerKey))
  const key = await crypto.subtle.importKey('raw', keyHash, 'AES-CBC', false, ['encrypt', 'decrypt'])

  const encryptedArray = encrypted.match(/.{1,2}/g)?.map(hex => parseInt(hex, 16)) ?? []
  const encryptedBuffer = new Uint8Array(encryptedArray)

  // Extract IV from first 16 bytes
  const iv = encryptedBuffer.slice(0, 16)
  const data = encryptedBuffer.slice(16)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    key,
    data
  )
  return new TextDecoder().decode(decrypted)
}

/**
 * Encrypt file content (binary data) using the same AES-CBC encryption
 */
export async function encryptFileContent(fileData: ArrayBuffer, lockerKey: string): Promise<string> {
  // Hash the locker key to ensure it's exactly 256 bits (32 bytes)
  const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(lockerKey))
  const key = await crypto.subtle.importKey('raw', keyHash, 'AES-CBC', false, ['encrypt', 'decrypt'])

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(16))

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    fileData
  )

  // Prepend IV to encrypted data
  const encryptedWithIV = new Uint8Array([...iv, ...new Uint8Array(encrypted)])
  const encryptedHex = Array.from(encryptedWithIV)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return encryptedHex
}

/**
 * Decrypt file content and return as ArrayBuffer
 */
export async function decryptFileContent(encrypted: string, lockerKey: string): Promise<ArrayBuffer> {
  // Hash the locker key to ensure it's exactly 256 bits (32 bytes)
  const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(lockerKey))
  const key = await crypto.subtle.importKey('raw', keyHash, 'AES-CBC', false, ['encrypt', 'decrypt'])

  const encryptedArray = encrypted.match(/.{1,2}/g)?.map(hex => parseInt(hex, 16)) ?? []
  const encryptedBuffer = new Uint8Array(encryptedArray)

  // Extract IV from first 16 bytes
  const iv = encryptedBuffer.slice(0, 16)
  const data = encryptedBuffer.slice(16)

  return await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    key,
    data
  )
}

/**
 * Check if encrypted content size exceeds the limit for Walrus blob storage
 */
export function shouldUseWalrusBlob(encryptedContent: string): boolean {
  // Convert hex string to bytes and check if > 200KB
  const sizeInBytes = encryptedContent.length / 2
  const walrusThresholdBytes = 200 * 1024 // 200KB
  return sizeInBytes > walrusThresholdBytes
}

/**
 * Get file MIME type from File object
 */
export function getFileMimeType(file: File): string {
  return file.type || 'application/octet-stream'
}

/**
 * Convert File to ArrayBuffer
 */
export function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => { resolve(reader.result as ArrayBuffer); }
    reader.onerror = () => {
      reject(new Error(reader.error?.message ?? 'Failed to read file'));
    }
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Convert ArrayBuffer to Blob for download
 */
export function arrayBufferToBlob(buffer: ArrayBuffer, mimeType: string): Blob {
  return new Blob([buffer], { type: mimeType })
}

export async function sha256Hash(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
