import type { Transaction } from '@mysten/sui/transactions'
import {useSuiClient, useWallet} from '@suiet/wallet-kit'
import {useMutation} from '@tanstack/react-query'
import { toast } from 'sonner'

import useLockerKey from '@/lib/locker/lockerKey'
import buildCreateEntryTx from '@/lib/locker/txBuilders/entry/buildCreateEntryTx'
import buildDeleteEntryTx from '@/lib/locker/txBuilders/entry/buildDeleteEntryTx'
import buildUpdateEntryTx from '@/lib/locker/txBuilders/entry/buildUpdateEntryTx'
import type {EntryFormData} from '@/lib/locker/types'
import { encryptContent,sha256Hash } from '@/lib/locker/utils'
import signAndExecuteAndWaitForTx from '@/lib/sui/utils/signAndExecuteAndWaitForTx'

import { getEntriesQueryKey } from './useEntriesQuery'

export const EntryMutationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const

type EntryMutationType = (typeof EntryMutationType)[keyof typeof EntryMutationType]

interface CreateMutationVariables {
  type: typeof EntryMutationType.CREATE
  data: EntryFormData
}

interface UpdateMutationVariables {
  type: typeof EntryMutationType.UPDATE
  data: {
    entryId: string
  } & EntryFormData
}

interface DeleteMutationVariables {
  type: typeof EntryMutationType.DELETE
  data: {
    entryId: string
  }
}

export type EntryMutationVariables = CreateMutationVariables | UpdateMutationVariables | DeleteMutationVariables

export default function useEntryMutation(vaultId: string | undefined) {
  const wallet = useWallet()
  const queryClient = useQueryClient()
  const suiClient = useSuiClient()
  const [lockerKey] = useLockerKey()

  return useMutation({
    mutationFn: async (variables: EntryMutationVariables) => {
      invariant(vaultId, 'Vault ID is required')

      let tx: Transaction

      switch (variables.type) {
        case EntryMutationType.CREATE:
          invariant(lockerKey, 'Locker key is required')
          tx = buildCreateEntryTx({
            vaultId,
            name: variables.data.name,
            hash: await sha256Hash(variables.data.content),
            content: await encryptContent(variables.data.content, lockerKey),
            entry_type: variables.data.entry_type,
            description: variables.data.description,
            tags: variables.data.tags,
            notes: variables.data.notes,
            image_url: variables.data.image_url,
            link: variables.data.link,
          })
          break;
        case EntryMutationType.UPDATE:
          invariant(lockerKey, 'Locker key is required')
          tx = buildUpdateEntryTx({
            entryId: variables.data.entryId,
            name: variables.data.name,
            hash: await sha256Hash(variables.data.content),
            content: await encryptContent(variables.data.content, lockerKey),
            entry_type: variables.data.entry_type,
            description: variables.data.description,
            tags: variables.data.tags,
            notes: variables.data.notes,
            image_url: variables.data.image_url,
            link: variables.data.link,
          })
          break;
        case EntryMutationType.DELETE:
          tx = buildDeleteEntryTx({
            entryId: variables.data.entryId,
            vaultId,
          })
          break;
      }


      const wait = signAndExecuteAndWaitForTx(wallet, suiClient, tx)

      if (variables.type === EntryMutationType.DELETE) {
        toast.promise(wait, {
          loading: 'Deleting entry...',
          success: 'Entry deleted successfully',
          error: 'Failed to delete entry',
        })
      }

      return wait
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getEntriesQueryKey(wallet.account?.address, lockerKey) })
    },
  })
}
