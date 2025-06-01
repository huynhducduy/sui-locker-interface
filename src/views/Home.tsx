import { useWallet } from '@suiet/wallet-kit'
import {Plus} from 'lucide-react'
import {useCallback, useState} from 'react'

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
import {VaultCard} from '@/components/vault/VaultCard'
import {VaultModal} from '@/components/vault/VaultModal'
import { ZkLoginSection } from '@/components/zklogin/ZkLoginSection'
import { useAuth } from '@/lib/auth/AuthProvider'
import useVaultMutation, { VaultMutationType } from '@/lib/locker/hooks/useVaultMutation'
import useVaultsQuery from '@/lib/locker/hooks/useVaultsQuery'
import type { Vault } from '@/lib/locker/types'
import WalletButton from '@/lib/sui/components/WalletButton'

interface EmptyStateProps {
  onCreateVault: () => void
}

function WalletNotConnectedState() {
  return (
    <div className="text-center py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-muted-foreground">
          <h2 className="text-2xl font-semibold mb-2">Welcome to SuiLocker</h2>
          <p className="text-lg">
            Secure, decentralized storage for your encrypted data on the Sui blockchain.
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg text-left">
            <h3 className="font-medium text-blue-900 mb-2">Getting Started:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Connect your Sui wallet or use zkLogin</li>
              <li>• Create your first vault</li>
              <li>• Start storing encrypted data securely</li>
              <li>• Manage your data with full ownership</li>
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Traditional Wallet Connection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Connect Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Use your existing Sui wallet (Suiet, Sui Wallet, etc.)
              </p>
              <WalletButton className="justify-center w-full" />
            </div>

            {/* zkLogin Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Social Login (zkLogin)</h3>
              <p className="text-sm text-muted-foreground">
                Connect using zero-knowledge proofs with your social accounts
              </p>
              <ZkLoginSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({onCreateVault}: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-muted-foreground">
          <h2 className="text-2xl font-semibold mb-2">No Vaults Yet</h2>
          <p className="text-lg">
            Create your first vault to start storing encrypted data securely.
          </p>
        </div>

        <Button size="lg" onClick={onCreateVault}>
          <Plus className="mr-2 h-5 w-5" />
          Create Your First Vault
        </Button>
      </div>
    </div>
  )
}

interface VaultGridProps {
  vaults: Vault[]
  onEditVault: (vault: Vault) => void
  onDeleteVault: (vault: Vault) => void
}

function VaultGrid({vaults, onEditVault, onDeleteVault}: VaultGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vaults.map(vault => (
        <VaultCard
          key={vault.id}
          vault={vault}
          onEdit={onEditVault}
          onDelete={onDeleteVault}
        />
      ))}
    </div>
  )
}

export default function Home() {
  const wallet = useWallet()
  const { isConnected, address, method } = useAuth()
  const {data: vaults, isLoading, error} = useVaultsQuery()
  const {mutate: mutateVault} = useVaultMutation()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVault, setEditingVault] = useState<Vault | undefined>(undefined)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [vaultToDelete, setVaultToDelete] = useState<Vault | undefined>(undefined)

  const handleEditVault = useCallback((vault: Vault) => {
    setEditingVault(vault)
    setIsModalOpen(true)
  }, [])

  const handleDeleteVault = useCallback((vault: Vault) => {
    setVaultToDelete(vault)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (vaultToDelete) {
      mutateVault({
        type: VaultMutationType.DELETE,
        data: {
          vaultId: vaultToDelete.id,
        }
      })
    }
    setDeleteDialogOpen(false)
    setVaultToDelete(undefined)
  }, [mutateVault, vaultToDelete])

  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false)
    setVaultToDelete(undefined)
  }, [])

  const handleCreateVault = useCallback(() => {
    setEditingVault(undefined)
    setIsModalOpen(true)
  }, [])

  const handleModalClose = useCallback((open: boolean) => {
    setIsModalOpen(open)
    if (!open) {
      setEditingVault(undefined)
    }
  }, [])

  // Handle different connection states
  if (!isConnected) {
    return <WalletNotConnectedState />
  }

  // For wallet connections, check network
  if (method === 'wallet' && wallet.chain?.id !== 'sui:testnet') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          Please switch to the Sui Testnet to use SuiLocker
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Vaults</h1>
            <p className="text-muted-foreground mt-2">
              Secure storage for your encrypted data
            </p>
            <p className="text-sm text-muted-foreground">
              Connected via {method === 'zklogin' ? 'zkLogin' : 'Wallet'}: {address}
            </p>
          </div>
          <WalletButton />
        </div>
        <div className="text-center">Loading vaults...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Vaults</h1>
            <p className="text-muted-foreground mt-2">
              Secure storage for your encrypted data
            </p>
            <p className="text-sm text-muted-foreground">
              Connected via {method === 'zklogin' ? 'zkLogin' : 'Wallet'}: {address}
            </p>
          </div>
          <WalletButton />
        </div>
        <div className="text-center text-red-500">
          Failed to load vaults. Please try again.
        </div>
      </div>
    )
  }

  const hasVaults = vaults && vaults.length > 0

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Vaults</h1>
            <p className="text-muted-foreground mt-2">
              Secure storage for your encrypted data
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleCreateVault}>
              <Plus className="mr-2 h-4 w-4" />
              Create Vault
            </Button>
            <WalletButton />
          </div>
        </div>

        {hasVaults ? (
          <VaultGrid
            vaults={vaults}
            onEditVault={handleEditVault}
            onDeleteVault={handleDeleteVault}
          />
        ) : (
          <EmptyState onCreateVault={handleCreateVault} />
        )}
      </div>

      <VaultModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        vault={editingVault}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vault</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{vaultToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
