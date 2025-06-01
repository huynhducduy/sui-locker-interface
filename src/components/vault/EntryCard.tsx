import {format} from 'date-fns'
import {
  Calendar,
  FileText,
  Link as LinkIcon,
  MoreVertical,
  Settings,
  Tag,
  Trash2,
} from 'lucide-react'
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
import { getFileSizeDisplay } from '@/lib/locker/fileDownloader'
import type {Entry} from '@/lib/locker/types'

interface EntryCardProps {
  readonly entry: Entry
  readonly onEdit: (entry: Entry) => void
  readonly onDelete: (entry: Entry) => void
  readonly onView: (entry: Entry) => void
}

export function EntryCard({entry, onEdit, onDelete, onView}: EntryCardProps) {
  const handleEdit = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      onEdit(entry)
    },
    [onEdit, entry],
  )

  const handleDelete = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      onDelete(entry)
    },
    [onDelete, entry],
  )

  const handleView = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      onView(entry)
    },
    [onView, entry],
  )

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't trigger view when clicking on dropdown menu
      if ((e.target as HTMLElement).closest('[data-dropdown-trigger]')) {
        return
      }
      handleView()
    },
    [handleView],
  )

  const handleDropdownClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const isFileEntry = entry.is_file
  const fileSize = getFileSizeDisplay(entry)

  return (
    <Card
      className='group hover:shadow-lg transition-shadow duration-200 cursor-pointer'
      onClick={handleCardClick}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1 min-w-0'>
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className='text-lg font-semibold truncate'>{entry.name}</CardTitle>
              {isFileEntry && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  FILE
                </span>
              )}
              {entry.walrus_blob_id && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  WALRUS
                </span>
              )}
            </div>
            {entry.description && (
              <CardDescription className='mt-1 line-clamp-2'>{entry.description}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-dropdown-trigger>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleDropdownClick}
              >
                <MoreVertical className='h-4 w-4' />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={handleEdit}>
                <Settings className='h-4 w-4' />
                Edit Entry
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className='text-destructive-foreground focus:text-destructive-foreground
                  focus:bg-destructive/50'
              >
                <Trash2 className='h-4 w-4 text-destructive-foreground' />
                Delete Entry
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className='pb-3 flex-grow'>
        {entry.image_url && (
          <div className='mb-3 rounded-md overflow-hidden'>
            <img
              src={entry.image_url}
              alt={entry.name}
              className='w-full h-32 object-cover'
              loading='lazy'
            />
          </div>
        )}

        <div className='space-y-2'>
          {/* File-specific information */}
          {isFileEntry && (
            <div className="space-y-1">
              {entry.filename && (
                <div className='flex items-center text-sm text-muted-foreground'>
                  <FileText className='mr-2 h-4 w-4' />
                  <span className='font-mono text-xs bg-muted px-2 py-1 rounded truncate'>
                    {entry.filename}
                  </span>
                </div>
              )}
              {fileSize && (
                <div className='text-xs text-muted-foreground'>
                  Size: {fileSize}
                </div>
              )}
            </div>
          )}

          {entry.entry_type && (
            <div className='flex items-center text-sm text-muted-foreground'>
              <FileText className='mr-2 h-4 w-4' />
              <span className='font-mono text-xs bg-muted px-2 py-1 rounded'>
                {entry.entry_type}
              </span>
            </div>
          )}

          {entry.tags.length > 0 && (
            <div className='flex items-center text-sm text-muted-foreground'>
              <Tag className='mr-2 h-4 w-4' />
              <div className='flex flex-wrap gap-1'>
                {entry.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className='bg-primary/10 text-primary px-2 py-1 rounded-full text-xs'
                  >
                    {tag}
                  </span>
                ))}
                {entry.tags.length > 3 && (
                  <span className='flex justify-center items-center text-xs text-muted-foreground'>
                    +{entry.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {entry.link && (
            <div className='flex items-center text-sm text-muted-foreground'>
              <LinkIcon className='mr-2 h-4 w-4' />
              <a
                href={entry.link}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline truncate'
                onClick={e => {
                  e.stopPropagation()
                }}
              >
                {entry.link}
              </a>
            </div>
          )}

          <div className='flex items-center justify-between text-sm text-muted-foreground'>
            <div className='flex items-center'>
              <Calendar className='mr-2 h-4 w-4' />
              <div>
                <div>Created {format(new Date(entry.created_at), 'MMM d, yyyy')}</div>
                {entry.updated_at !== entry.created_at && (
                  <div className='text-xs'>
                    Updated {format(new Date(entry.updated_at), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className='pt-3'>
        <Button variant='outline' className='w-full' onClick={handleView}>
          {isFileEntry ? 'View & Download' : 'View Entry'}
        </Button>
      </CardFooter>
    </Card>
  )
}
