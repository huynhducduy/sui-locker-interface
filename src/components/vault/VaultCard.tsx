import {Link} from '@tanstack/react-router'
import {format} from 'date-fns'
import {Calendar, FileText, MoreVertical, Settings, Trash2} from 'lucide-react'
import {useCallback} from 'react'

import {Button} from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type {Vault} from '@/lib/locker/types'

interface VaultCardProps {
  readonly vault: Vault
  readonly onEdit: (vault: Vault) => void
  readonly onDelete: (vault: Vault) => void
}

export function VaultCard({vault, onEdit, onDelete}: VaultCardProps) {
  const latestVault = useLatest(vault)

  const handleEdit = useCallback(() => {
    onEdit(latestVault.current)
  }, [onEdit])

  const handleDelete = useCallback(() => {
    onDelete(latestVault.current)
  }, [onDelete])

  return (
    <Card className='group hover:shadow-lg transition-shadow duration-200'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1 min-w-0'>
            <CardTitle className='text-lg font-semibold truncate'>
              <Link
                to='/vault/$vaultId'
                params={{vaultId: vault.id}}
                className='hover:text-primary transition-colors'
              >
                {vault.name}
              </Link>
            </CardTitle>
            {vault.description && (
              <CardDescription className='mt-1 line-clamp-2'>{vault.description}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='opacity-0 group-hover:opacity-100 transition-opacity'
              >
                <MoreVertical className='h-4 w-4' />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={handleEdit}>
                <Settings className='h-4 w-4' />
                Edit Vault
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className='text-destructive-foreground focus:text-destructive-foreground focus:bg-destructive/50'>
                <Trash2 className='h-4 w-4 text-destructive-foreground' />
                Delete Vault
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className='pb-3 flex-grow flex flex-col gap-2'>
        {vault.image_url && (
          <div className='mb-3 rounded-md overflow-hidden'>
            <img
              src={vault.image_url}
              alt={vault.name}
              className='w-full h-32 object-cover'
              loading='lazy'
            />
          </div>
        )}

        <div className='flex items-center justify-between text-sm text-muted-foreground'>
          <div className='flex items-center'>
            <FileText className='mr-2 h-4 w-4' />
            <span>
              {vault.entry_count} {vault.entry_count === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        </div>
          <div className='flex items-center justify-between text-sm text-muted-foreground'>
            <div className='flex items-center'>
              <Calendar className='mr-2 h-4 w-4' />
              <div>
                <div>Created {format(new Date(vault.created_at), 'MMM d, yyyy')}</div>
                {vault.updated_at !== vault.created_at && (
                  <div className='text-xs'>
                    Updated {format(new Date(vault.updated_at), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
          </div>
      </CardContent>

      <CardFooter className='pt-3'>
        <Link to='/vault/$vaultId' params={{vaultId: vault.id}} className='w-full'>
          <Button variant='outline' className='w-full'>
            View Entries
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
