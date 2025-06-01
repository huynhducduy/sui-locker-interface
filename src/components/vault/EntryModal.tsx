import { arktypeResolver } from '@hookform/resolvers/arktype'
import { useSuiClient, useWallet } from '@suiet/wallet-kit'
import {Check, ChevronsUpDown, X} from 'lucide-react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {Controller, type ControllerRenderProps,useForm} from 'react-hook-form'

import { FileUpload } from '@/components/FileUpload'
import {Button} from '@/components/ui/button'
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Textarea} from '@/components/ui/textarea'
import {COMMON_MIME_TYPES} from '@/lib/locker/constants'
import { processFileForEntry } from '@/lib/locker/fileProcessor'
import useEntryMutation, { EntryMutationType } from '@/lib/locker/hooks/useEntryMutation'
import useLockerKey from '@/lib/locker/lockerKey'
import { type Entry,type EntryFormData,entryFormSchema } from '@/lib/locker/types'
import noThrow from '@/utils/schema/noThrow'
import {cn} from '@/utils/ui'

interface EntryModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly vaultId: string
  readonly entry?: Entry | undefined // If provided, it's edit mode
}

const resolver = arktypeResolver(noThrow(entryFormSchema))

export function EntryModal({open, onOpenChange, vaultId, entry}: EntryModalProps) {
  const isEditMode = !!entry
  const [lockerKey] = useLockerKey()
  const wallet = useWallet()
  const latestEntry = useLatest(entry)
  const suiClient = useSuiClient()

  // Local state for tags
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [fileProcessingProgress, setFileProcessingProgress] = useState(0)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isFileMode, setIsFileMode] = useState(false)

  // Combobox state
  const [mimeTypeComboboxOpen, setMimeTypeComboboxOpen] = useState(false)

  const form = useForm({
    defaultValues: {
      name: '',
      content: '',
      entry_type: '',
      description: '',
      notes: '',
      image_url: '',
      link: '',
      filename: '',
      file_size: 0,
      walrus_blob_id: '',
      is_file: false,
    },
    resolver,
  })

  const {mutateAsync, isPending} = useEntryMutation(vaultId)

  // Watch entry_type field for reactive updates
  const entryType = form.watch('entry_type')

  // Get display text for selected MIME type
  const getMimeTypeDisplayText = useMemo(() => {
    if (!entryType) {
      return "Select type (optional)"
    }
    const foundEntry = Object.entries(COMMON_MIME_TYPES).find(([, value]) => value === entryType)
    return foundEntry?.[0]?.replace(/_/g, ' ') ?? "Select type (optional)"
  }, [entryType])

  // File upload handlers
  const handleFileSelect = useCallback(async (file: File) => {
    if (!lockerKey) {
      setFileError('Locker key is required for file encryption')
      return
    }

    if (!wallet.connected) {
      setFileError('Wallet must be connected to upload files')
      return
    }

    setSelectedFile(file)
    setFileError(null)
    setIsProcessingFile(true)
    setFileProcessingProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setFileProcessingProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const result = await processFileForEntry(file, lockerKey, wallet, suiClient)

      clearInterval(progressInterval)
      setFileProcessingProgress(100)

      // Update form with file data
      form.setValue('content', result.encryptedContent)
      form.setValue('entry_type', result.mimeType)
      form.setValue('filename', result.filename)
      form.setValue('file_size', result.fileSize)
      form.setValue('walrus_blob_id', result.walrusBlobId ?? '')
      form.setValue('is_file', true)

      // Auto-fill name if empty
      if (!form.getValues('name')) {
        form.setValue('name', file.name)
      }

      setIsFileMode(true)
    } catch (error) {
      console.error('File processing failed:', error)
      setFileError(error instanceof Error ? error.message : 'File processing failed')
      setSelectedFile(null)
    } finally {
      setIsProcessingFile(false)
    }
  }, [lockerKey, form, wallet, suiClient])

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null)
    setFileError(null)
    setIsFileMode(false)

    // Clear file-related form fields
    form.setValue('content', '')
    form.setValue('filename', '')
    form.setValue('file_size', 0)
    form.setValue('walrus_blob_id', '')
    form.setValue('is_file', false)
  }, [form])

  const handleModeToggle = useCallback(() => {
    if (isFileMode) {
      handleFileRemove()
    }
    setIsFileMode(!isFileMode)
  }, [isFileMode, handleFileRemove])

  // Combobox handlers
  const handleMimeTypeSelect = useCallback((value: string) => {
    form.setValue('entry_type', value)
    setMimeTypeComboboxOpen(false)
  }, [form])

  const handleMimeTypeClear = useCallback(() => {
    form.setValue('entry_type', '')
    setMimeTypeComboboxOpen(false)
  }, [form])

  const handleAddTag = useCallback((inputValue: string = tagInput) => {
    // Split by commas and process each tag
    const potentialTags = inputValue.split(',').map(tag => tag.trim()).filter(tag => tag)

    if (potentialTags.length > 0) {
      const newTags = potentialTags.filter(tag => tag && !tags.includes(tag))
      if (newTags.length > 0) {
        setTags(prev => [...prev, ...newTags])
      }
      setTagInput('')
    }
  }, [tagInput, tags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }, [])

  const handleTagInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag()
    }
  }, [handleAddTag])

  // Create stable handlers for form fields
  const handleTagInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value)
  }, [])

  const handleAddTagClick = useCallback(() => {
    handleAddTag()
  }, [handleAddTag])

  const handleMimeTypeComboboxOpenChange = useCallback((open: boolean) => {
    setMimeTypeComboboxOpen(open)
  }, [])

  // Create memoized handlers for MIME type selection
  const mimeTypeHandlers = useMemo(() => {
    return Object.entries(COMMON_MIME_TYPES).reduce<Record<string, () => void>>((handlers, [, value]) => {
      handlers[value] = () => {
        handleMimeTypeSelect(value)
      }
      return handlers
    }, {})
  }, [handleMimeTypeSelect])

  // Create memoized handlers for tag removal
  const tagRemovalHandlers = useMemo(() => {
    return tags.reduce<Record<string, () => void>>((handlers, tag) => {
      handlers[tag] = () => {
        handleRemoveTag(tag)
      }
      return handlers
    }, {})
  }, [tags, handleRemoveTag])

  // Render function for the Controller component
  const renderMimeTypeController = useCallback(({ field }: { field: ControllerRenderProps<EntryFormData, 'entry_type'> }) => (
    <Popover open={mimeTypeComboboxOpen} onOpenChange={handleMimeTypeComboboxOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={mimeTypeComboboxOpen}
          className="w-full justify-between"
          disabled={isPending || isProcessingFile}
        >
          {getMimeTypeDisplayText}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search types..." />
          <CommandList>
            <CommandEmpty>No type found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value=""
                onSelect={handleMimeTypeClear}
              >
                <Check className={cn(
                  "mr-2 h-4 w-4",
                  field.value === '' ? "opacity-100" : "opacity-0"
                )} />
                None (optional)
              </CommandItem>
              {Object.entries(COMMON_MIME_TYPES).map(([key, value]) => {
                const handleSelectThisMimeType = mimeTypeHandlers[value]
                return (
                  <CommandItem
                    key={key}
                    value={value}
                    onSelect={handleSelectThisMimeType ?? (() => {})}
                  >
                    <Check className={cn(
                      "mr-2 h-4 w-4",
                      value === field.value ? "opacity-100" : "opacity-0"
                    )} />
                    {key.replace(/_/g, ' ')}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  ), [mimeTypeComboboxOpen, handleMimeTypeComboboxOpenChange, isPending, isProcessingFile, getMimeTypeDisplayText, handleMimeTypeClear, mimeTypeHandlers])

  // Update form when entry prop changes
  useEffect(() => {
    if (entry) {
      form.reset({
        name: entry.name,
        content: entry.content,
        entry_type: entry.entry_type ?? '',
        description: entry.description ?? '',
        notes: entry.notes ?? '',
        image_url: entry.image_url ?? '',
        link: entry.link ?? '',
        filename: '',
        file_size:  0,
        walrus_blob_id: '',
        is_file: false,
      })
      setTags(entry.tags)
    } else {
      form.reset({
        name: '',
        content: '',
        entry_type: '',
        description: '',
        notes: '',
        image_url: '',
        link: '',
        filename: '',
        file_size: 0,
        walrus_blob_id: '',
        is_file: false,
      })
      setTags([])
      setIsFileMode(false)
      setSelectedFile(null)
      setFileError(null)
    }
    setTagInput('')
  }, [entry, form])

  const handleSubmit = useCallback(async (data: EntryFormData) => {
    try {
      const submissionData = {
        ...data,
        tags,
      }

      console.log(submissionData)

      if (isEditMode && latestEntry.current) {
        await mutateAsync({
          type: EntryMutationType.UPDATE,
          data: {
            entryId: latestEntry.current.id,
            ...submissionData,
          },
        })
      } else {
        await mutateAsync({
          type: EntryMutationType.CREATE,
          data: submissionData,
        })
      }

      // Reset form and state
      form.reset()
      setTags([])
      setTagInput('')
      setSelectedFile(null)
      setFileError(null)
      setIsFileMode(false)
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Failed to save entry:', error)
    } finally {
      // Close modal and reset form
      onOpenChange(false)
    }
  }, [isEditMode, onOpenChange, form, mutateAsync, tags])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!isPending && !isProcessingFile) {
      onOpenChange(newOpen)
      if (!newOpen) {
        form.reset()
        setTags([])
        setTagInput('')
        setSelectedFile(null)
        setFileError(null)
        setIsFileMode(false)
      }
    }
  }, [isPending, isProcessingFile, onOpenChange, form])

  const handleCancelClick = useCallback(() => {
    handleOpenChange(false)
  }, [handleOpenChange])

  const getSubmitButtonText = () => {
    if (isPending) return 'Saving...'
    if (isProcessingFile) return 'Processing file...'
    return isEditMode ? 'Update Entry' : 'Create Entry'
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Entry' : 'Create New Entry'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update your entry information and content.'
              : 'Create a new entry to store encrypted data or files in this vault.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Enter entry name"
              {...form.register('name', { required: 'Entry name is required' })}
              disabled={isPending || isProcessingFile}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description of this entry"
              className="resize-none"
              rows={2}
              {...form.register('description')}
              disabled={isPending || isProcessingFile}
            />
          </div>

          {/* Content Type Toggle */}
          <div className="space-y-2">
            <Label>Content Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isFileMode ? "outline" : "default"}
                size="sm"
                onClick={handleModeToggle}
                disabled={isPending || isProcessingFile}
              >
                Text Content
              </Button>
              <Button
                type="button"
                variant={isFileMode ? "default" : "outline"}
                size="sm"
                onClick={handleModeToggle}
                disabled={isPending || isProcessingFile}
              >
                File Upload
              </Button>
            </div>
          </div>

          {/* File Upload Section */}
          {isFileMode ? (
            <div className="space-y-2">
              <Label>File Upload *</Label>
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                selectedFile={selectedFile}
                isProcessing={isProcessingFile}
                processingProgress={fileProcessingProgress}
                error={fileError}
                disabled={isPending}
              />
              {!selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Upload a file to encrypt and store in this entry
                </p>
              )}
            </div>
          ) : (
            /* Text Content Section */
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Enter the content you want to store (will be encrypted)"
                className="resize-none min-h-[120px]"
                {...form.register('content', { required: 'Content is required' })}
                disabled={isPending || isProcessingFile}
              />
              {form.formState.errors.content && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.content.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                The main content of your entry (text, JSON, etc.)
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">MIME Type</Label>
              <Controller
                name="entry_type"
                control={form.control}
                render={renderMimeTypeController}
              />
              {isFileMode && (
                <p className="text-xs text-muted-foreground">
                  Auto-detected from uploaded file
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Related Link</Label>
              <Input
                id="link"
                type="url"
                placeholder="https://example.com"
                {...form.register('link')}
                disabled={isPending || isProcessingFile}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add tags separated by commas or press Enter"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                disabled={isPending || isProcessingFile}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTagClick}
                disabled={isPending || isProcessingFile || !tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => {
                  const handleRemoveThisTag = tagRemovalHandlers[tag]
                  return (
                    <span
                      key={`${tag}-${String(index)}`}
                      className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={handleRemoveThisTag}
                        className="hover:text-destructive"
                        disabled={isPending || isProcessingFile}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or comments"
              className="resize-none"
              rows={3}
              {...form.register('notes')}
              disabled={isPending || isProcessingFile}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              {...form.register('image_url')}
              disabled={isPending || isProcessingFile}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelClick}
              disabled={isPending || isProcessingFile}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || isProcessingFile || (isFileMode && !selectedFile)}
            >
              {getSubmitButtonText()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
