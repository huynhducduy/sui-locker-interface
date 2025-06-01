import type { Transaction } from '@mysten/sui/transactions'
import {useSuiClient, useWallet} from '@suiet/wallet-kit'
import {useMutation} from '@tanstack/react-query'
import { toast } from 'sonner'

import buildCreateVaultTx from '@/lib/locker/txBuilders/vault/buildCreateVaultTx'
import buildDeleteVaultTx from '@/lib/locker/txBuilders/vault/buildDeleteVaultTx'
import buildUpdateVaultTx from '@/lib/locker/txBuilders/vault/buildUpdateVaultTx'
import type {VaultFormData} from '@/lib/locker/types'
import signAndExecuteAndWaitForTx from '@/lib/sui/utils/signAndExecuteAndWaitForTx'

import { getVaultsQueryKey } from './useVaultsQuery'

export const VaultMutationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const

type VaultMutationType = (typeof VaultMutationType)[keyof typeof VaultMutationType]

interface CreateMutationVariables {
  type: typeof VaultMutationType.CREATE
  data: VaultFormData
}

interface DeleteMutationVariables {
  type: typeof VaultMutationType.DELETE
  data: {
    vaultId: string
  }
}

interface UpdateMutationVariables {
  type: typeof VaultMutationType.UPDATE
    data: {
      vaultId: string
    } & VaultFormData
}


export type VaultMutationVariables = CreateMutationVariables | DeleteMutationVariables | UpdateMutationVariables

export default function useVaultMutation() {
  const wallet = useWallet()
  const queryClient = useQueryClient()
  const suiClient = useSuiClient()

  return useMutation({
    mutationFn: async (variables: VaultMutationVariables) => {
      let tx: Transaction

      switch (variables.type) {
        case VaultMutationType.CREATE:
          tx = buildCreateVaultTx({
            name: variables.data.name,
            description: variables.data.description,
            imageUrl: variables.data.image_url,
          })
          break
        case VaultMutationType.UPDATE:
          tx = buildUpdateVaultTx({
            vaultId: variables.data.vaultId,
            name: variables.data.name,
            description: variables.data.description,
            imageUrl: variables.data.image_url,
          })
          break
        case VaultMutationType.DELETE:
          tx = buildDeleteVaultTx({
            vaultId: variables.data.vaultId,
          })
          break
      }

      const wait = signAndExecuteAndWaitForTx(wallet, suiClient, tx)

      if (variables.type === VaultMutationType.DELETE) {
        toast.promise(wait, {
          loading: 'Deleting vault...',
          success: 'Vault deleted successfully',
          error: 'Failed to delete vault',
        })
      }
      return wait
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getVaultsQueryKey(wallet.account?.address ?? '') })
    },
  })
}
