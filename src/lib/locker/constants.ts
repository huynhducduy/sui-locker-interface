export const COMMON_MIME_TYPES = {
  TEXT: 'text/plain',
  JSON: 'application/json',
  IMAGE_PNG: 'image/png',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_GIF: 'image/gif',
  IMAGE_WEBP: 'image/webp',
  IMAGE_SVG: 'image/svg+xml',
  PDF: 'application/pdf',
  HTML: 'text/html',
  MARKDOWN: 'text/markdown',
  CSV: 'text/csv',
  XML: 'application/xml',
  JAVASCRIPT: 'text/javascript',
  CSS: 'text/css',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ZIP: 'application/zip',
  RAR: 'application/x-rar-compressed',
  SEVENZIP: 'application/x-7z-compressed',
  MP3: 'audio/mpeg',
  MP4: 'video/mp4',
  AVI: 'video/x-msvideo',
  MOV: 'video/quicktime',
  BINARY: 'application/octet-stream',
} as const

export type CommonMimeType = typeof COMMON_MIME_TYPES[keyof typeof COMMON_MIME_TYPES]

// File upload constants
export const FILE_UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB max file size
  WALRUS_THRESHOLD: 200 * 1024, // 200KB threshold for Walrus storage
  ACCEPTED_FILE_TYPES: [
    // Images
    'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
    // Documents
    'application/pdf', 'text/plain', 'text/markdown', 'text/html',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Code
    'text/javascript', 'text/css', 'application/json', 'text/csv', 'application/xml',
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    // Media
    'audio/mpeg', 'video/mp4', 'video/x-msvideo', 'video/quicktime',
    // Binary
    'application/octet-stream'
  ]
} as const
