import {Link, useParams} from '@tanstack/react-router'
import {ArrowLeft, Check, ChevronsUpDown, Filter, Plus, Search} from 'lucide-react'
import {useCallback, useMemo, useState} from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from '@/components/ui/command'
import {Input} from '@/components/ui/input'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {EntryCard} from '@/components/vault/EntryCard'
import {EntryDetailModal} from '@/components/vault/EntryDetailModal'
import {EntryModal} from '@/components/vault/EntryModal'
import {COMMON_MIME_TYPES} from '@/lib/locker/constants'
import useEntriesQuery, { type EntryFilter, type EntrySort } from '@/lib/locker/hooks/useEntriesQuery'
import useEntryMutation, { EntryMutationType } from '@/lib/locker/hooks/useEntryMutation'
import useVaultQuery from '@/lib/locker/hooks/useVaultQuery'
import type {Entry} from '@/lib/locker/types'
import ConnectedWalletInfo from '@/lib/sui/components/ConnectedWalletInfo'
import {cn} from '@/utils/ui'

interface EmptyStateProps {
  readonly onCreateEntry: () => void
}

function EmptyState({onCreateEntry}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-muted-foreground mb-4">
        <p className="text-lg">No entries found</p>
        <p>Create your first entry to get started</p>
      </div>
      <Button onClick={onCreateEntry}>
        <Plus className="mr-2 h-4 w-4" />
        Create Your First Entry
      </Button>
    </div>
  )
}

interface EntryGridProps {
  readonly entries: Entry[]
  readonly onEditEntry: (entry: Entry) => void
  readonly onDeleteEntry: (entry: Entry) => void
  readonly onViewEntry: (entry: Entry) => void
}

function EntryGrid({entries, onEditEntry, onDeleteEntry, onViewEntry}: EntryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {entries.map(entry => (
        <EntryCard
          key={entry.id}
          entry={entry}
          onEdit={onEditEntry}
          onDelete={onDeleteEntry}
          onView={onViewEntry}
        />
      ))}
    </div>
  )
}

interface LoadingStateProps {
  readonly message: string
}

function LoadingState({message}: LoadingStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-muted-foreground">{message}</div>
    </div>
  )
}

interface ErrorStateProps {
  readonly message: string
}

function ErrorState({message}: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-red-500">{message}</div>
    </div>
  )
}

interface NoResultsStateProps {
  readonly onClearFilters: () => void
}

function NoResultsState({onClearFilters}: NoResultsStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-muted-foreground mb-4">
        <p className="text-lg">No entries match your search criteria</p>
        <p>Try adjusting your search or filters</p>
      </div>
      <Button variant="outline" onClick={onClearFilters}>
        Clear Filters
      </Button>
    </div>
  )
}

interface ClearFiltersButtonProps {
  readonly onClearFilters: () => void
}

function ClearFiltersButton({onClearFilters}: ClearFiltersButtonProps) {
  return (
    <Button variant="outline" onClick={onClearFilters}>
      <Filter className="mr-2 h-4 w-4" />
      Clear
    </Button>
  )
}

export default function VaultDetail() {
  const {vaultId} = useParams({from: '/vault/$vaultId'})
  const {data: vault, isLoading: vaultLoading, error: vaultError} = useVaultQuery(vaultId)

  // Entry modal state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Entry | undefined>(undefined)

  // Entry detail modal state
  const [isEntryDetailModalOpen, setIsEntryDetailModalOpen] = useState(false)
  const [viewingEntry, setViewingEntry] = useState<Entry | null>(null)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<Entry | undefined>(undefined)

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [comboboxOpen, setComboboxOpen] = useState(false)

  // Entry queries with filtering
  const filter: EntryFilter = useMemo(() => {
    const result: EntryFilter = {}
    if (vaultId) result.vault_id = vaultId
    if (searchTerm) result.search = searchTerm
    if (filterType && filterType !== 'all') result.entry_type = filterType
    return result
  }, [vaultId, searchTerm, filterType])

  const sort: EntrySort = {
    field: 'updated_at',
    direction: 'desc',
  }

  const {data: entries, isLoading: entriesLoading, error: entriesError} = useEntriesQuery(filter, sort)
  const mutate = useEntryMutation(vaultId)

  const handleEditEntry = useCallback((entry: Entry) => {
    setEditingEntry(entry)
    setIsEntryModalOpen(true)
  }, [])

  const handleDeleteEntry = useCallback((entry: Entry) => {
    setEntryToDelete(entry)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDeleteEntry = useCallback(() => {
    if (entryToDelete) {
      mutate.mutate({
        type: EntryMutationType.DELETE,
        data: {
          entryId: entryToDelete.id,
        },
      })
    }
    setDeleteDialogOpen(false)
    setEntryToDelete(undefined)
  }, [mutate, entryToDelete])

  const handleCancelDeleteEntry = useCallback(() => {
    setDeleteDialogOpen(false)
    setEntryToDelete(undefined)
  }, [])

  const handleViewEntry = useCallback((entry: Entry) => {
    setViewingEntry(entry)
    setIsEntryDetailModalOpen(true)
  }, [])

  const handleCreateEntry = useCallback(() => {
    setEditingEntry(undefined)
    setIsEntryModalOpen(true)
  }, [])

  const handleEntryModalClose = useCallback((open: boolean) => {
    setIsEntryModalOpen(open)
    if (!open) {
      setEditingEntry(undefined)
    }
  }, [])

  const handleEntryDetailModalClose = useCallback((open: boolean) => {
    setIsEntryDetailModalOpen(open)
    if (!open) {
      setViewingEntry(null)
    }
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleFilterAllSelect = useCallback(() => {
    setFilterType('all')
    setComboboxOpen(false)
  }, [])

  const handleFilterTypeSelect = useCallback((value: string) => {
    setFilterType(value)
    setComboboxOpen(false)
  }, [])

  const handleFilterTypeSelectCallback = useCallback((value: string) => () => {
    handleFilterTypeSelect(value)
  }, [handleFilterTypeSelect])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setFilterType('all')
  }, [])

  // Get display text for selected filter type
  const getFilterDisplayText = useMemo(() => {
    if (filterType === 'all') {
      return "All types"
    }
    const foundEntry = Object.entries(COMMON_MIME_TYPES).find(([, value]) => value === filterType)
    return foundEntry?.[0]?.replace(/_/g, ' ') ?? "All types"
  }, [filterType])

  if (vaultLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState message="Loading vault..." />
      </div>
    )
  }

  if (vaultError || !vault) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState message={vaultError ? 'Failed to load vault' : 'Vault not found'} />
      </div>
    )
  }

  const hasEntries = entries && entries.length > 0
  const isLoading = entriesLoading
  const hasActiveFilters = searchTerm || (filterType && filterType !== 'all')

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState message="Loading entries..." />
    }

    if (entriesError) {
      return <ErrorState message="Failed to load entries. Please try again." />
    }

    if (hasEntries) {
      return (
        <EntryGrid
          entries={entries}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
          onViewEntry={handleViewEntry}
        />
      )
    }

    if (hasActiveFilters) {
      return <NoResultsState onClearFilters={clearFilters} />
    }

    return <EmptyState onCreateEntry={handleCreateEntry} />
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-4 mt-[14px]">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Vaults
              </Button>
            </Link>
            <ConnectedWalletInfo />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{vault.name}</h1>
              {vault.description && (
                <p className="text-muted-foreground mt-2">{vault.description}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {vault.entry_count} {vault.entry_count === 1 ? 'entry' : 'entries'}
              </p>
            </div>

            <Button onClick={handleCreateEntry}>
              <Plus className="mr-2 h-4 w-4" />
              Create Entry
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 flex justify-center items-center">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search entries..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-[200px] justify-between"
                >
                  {getFilterDisplayText}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search types..." />
                  <CommandList>
                    <CommandEmpty>No type found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={handleFilterAllSelect}
                      >
                        <Check className={cn(
                          "mr-2 h-4 w-4",
                          filterType === 'all' ? "opacity-100" : "opacity-0"
                        )} />
                        All types
                      </CommandItem>
                      {Object.entries(COMMON_MIME_TYPES).map(([key, value]) => (
                        <CommandItem
                          key={key}
                          value={value}
                          onSelect={handleFilterTypeSelectCallback(value)}
                        >
                          <Check className={cn(
                            "mr-2 h-4 w-4",
                            value === filterType ? "opacity-100" : "opacity-0"
                          )} />
                          {key.replace(/_/g, ' ')}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <ClearFiltersButton onClearFilters={clearFilters} />
            )}
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>

      <EntryModal
        open={isEntryModalOpen}
        onOpenChange={handleEntryModalClose}
        vaultId={vaultId}
        entry={editingEntry}
      />

      <EntryDetailModal
        open={isEntryDetailModalOpen}
        onOpenChange={handleEntryDetailModalClose}
        entry={viewingEntry}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{entryToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDeleteEntry}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteEntry} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
