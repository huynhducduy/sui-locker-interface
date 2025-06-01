import { arktypeResolver } from '@hookform/resolvers/arktype'
import {useCallback, useEffect} from 'react'
import {useForm} from 'react-hook-form'

import {Button} from '@/components/ui/button'
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
import {Textarea} from '@/components/ui/textarea'
import useVaultMutation, { VaultMutationType } from '@/lib/locker/hooks/useVaultMutation'
import {type Vault,type VaultFormData, vaultFormSchema} from '@/lib/locker/types'
import noThrow from '@/utils/schema/noThrow'

interface VaultModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly vault?: Vault | undefined
}

const resolver = arktypeResolver(noThrow(vaultFormSchema))
export function VaultModal({open, onOpenChange, vault}: VaultModalProps) {
    const isEditMode = !!vault
    const {mutateAsync, isPending} = useVaultMutation()

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      image_url: '',
    },
    resolver,
  })

  // Update form when vault prop changes
  useEffect(() => {
    if (vault) {
      form.reset({
        name: vault.name,
        description: vault.description ?? '',
        image_url: vault.image_url ?? '',
      })
    } else {
      form.reset({
        name: '',
        description: '',
        image_url: '',
      })
    }
  }, [vault, form])

  const handleSubmit = useCallback(async (data: VaultFormData) => {
    try {

      if (isEditMode) {
        await mutateAsync({
          type: VaultMutationType.UPDATE,
          data: {
            vaultId: vault.id,
            ...data,
          },
        })
      } else {
        await mutateAsync({
          type: VaultMutationType.CREATE,
          data,
        })
      }
      form.reset()
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Failed to save vault:', error)
    } finally {
      // Close modal and reset form
      onOpenChange(false)
    }
  }, [isEditMode, onOpenChange, form, mutateAsync, vault?.id])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!isPending) {
      onOpenChange(newOpen)
      if (!newOpen) {
        form.reset()
      }
    }
  }, [isPending, onOpenChange, form])

  const handleCancelClick = useCallback(() => {
    handleOpenChange(false)
  }, [handleOpenChange])

  const getSubmitButtonText = () => {
    if (isPending) {
      if (isEditMode) {
        return 'Updating...'
      }
      return 'Creating...'
    }
    return isEditMode ? 'Update Vault' : 'Create Vault'
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Vault' : 'Create New Vault'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update your vault information. Your entries will remain unchanged.'
              : 'Create a new vault to securely store your encrypted data.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Enter vault name"
              {...form.register('name', { required: 'Vault name is required' })}
              disabled={isPending}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              A descriptive name for your vault
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description of what you'll store in this vault"
              className="resize-none"
              rows={3}
              {...form.register('description')}
              disabled={isPending}
            />
            <p className="text-sm text-muted-foreground">
              Briefly describe the purpose of this vault
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              {...form.register('image_url')}
              disabled={isPending}
            />
            <p className="text-sm text-muted-foreground">
              Optional image to represent your vault
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelClick}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {getSubmitButtonText()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
