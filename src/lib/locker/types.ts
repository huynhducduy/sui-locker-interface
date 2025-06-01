import { type } from "arktype";

export const SuiObjectId = type.string
export const SuiAddress = type.string
export const SuiTimestamp = type.number

export const Entry = type({
  id: SuiObjectId,
  owner: SuiAddress,
  vault_id: SuiObjectId,
  name: 'string',
  hash: 'string',
  content: 'string',
  'entry_type?': 'string | null | undefined',
  'description?': 'string | null | undefined',
  tags: 'string[]',
  'notes?': 'string | null | undefined',
  'image_url?': 'string | null | undefined',
  'link?': 'string | null | undefined',
  created_at: SuiTimestamp,
  updated_at: SuiTimestamp,
})

export type Entry = typeof Entry.infer
export const entryFormSchema = type({
  name: type('string>0').configure({
    message: 'Entry name is required',
  }),

  'content': type('string>0').configure({
    message: 'Entry content is required',
  }),

  'entry_type?': 'string | null | undefined',

  'description?': 'string | null | undefined',

  'tags?': 'string[] | null | undefined',

  'notes?': 'string | null | undefined',

  'image_url?': 'string | null | undefined',

  'link?': 'string | null | undefined',

  'filename?': 'string | null | undefined',
  'file_size?': 'number | null | undefined',
  'walrus_blob_id?': 'string | null | undefined',
  'is_file?': 'boolean | null | undefined',
})
export type EntryFormData = typeof entryFormSchema.infer

export const Vault = type({
  id: SuiObjectId,
  owner: SuiAddress,
  name: 'string',
  'description?': 'string | null | undefined',
  'image_url?': 'string | null | undefined',
  created_at: SuiTimestamp,
  updated_at: SuiTimestamp,
  entry_count: SuiTimestamp,
})
export type Vault = typeof Vault.infer

export const vaultFormSchema = type({
  name: type('string>0').configure({
    message: 'Vault name is required',
  }),

  'description?': 'string',

  'image_url?': 'string',
})
export type VaultFormData = typeof vaultFormSchema.infer

export const fileUploadSchema = type({
  file: 'File',
  name: type('string>0').configure({
    message: 'File name is required',
  }),
  'description?': 'string | null | undefined',
  'tags?': 'string[] | null | undefined',
  'notes?': 'string | null | undefined',
})

export type FileUploadData = typeof fileUploadSchema.infer

export interface FileProcessingResult {
  encryptedContent: string
  filename: string
  mimeType: string
  fileSize: number
  shouldUseWalrus: boolean
  walrusBlobId?: string | undefined
}
