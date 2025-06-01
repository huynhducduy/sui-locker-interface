import {bcs} from '@mysten/sui/bcs'
import { useSuiClient } from "@suiet/wallet-kit"

import useLockerKey from '@/lib/locker/lockerKey'
import buildListEntryTx from "@/lib/locker/txBuilders/entry/buildListEntryTx"
import buildReadEntryTx from "@/lib/locker/txBuilders/entry/buildReadEntryTx"
import { decryptContent, sha256Hash } from '@/lib/locker/utils'
import useCurrentAddress from '@/lib/sui/hooks/useCurrentAddress'

export function getEntriesQueryKey(address: string | undefined, lockerKey: string | undefined) {
  return ['entries', address, sha256Hash(lockerKey ?? '')]
}

export interface EntryFilter {
  vault_id?: string | undefined
  entry_type?: string | undefined
  tags?: string[] | undefined
  search?: string | undefined
}

export interface EntrySort {
  field: 'name' | 'created_at' | 'updated_at' | 'entry_type'
  direction: 'asc' | 'desc'
}

export default function useEntriesQuery(filter: EntryFilter = {}, sort: EntrySort = {field: 'created_at', direction: 'desc'}) {

  const currentAddress = useCurrentAddress()
  const suiClient = useSuiClient()
  const [lockerKey] = useLockerKey()

  return useQuery({
    queryKey: getEntriesQueryKey(currentAddress, lockerKey),
    queryFn: currentAddress && lockerKey
      ? async () => {
          const result = await suiClient.devInspectTransactionBlock({
            transactionBlock: buildListEntryTx({
              userAddress: currentAddress,
            }),
            sender: currentAddress,
          })

          const entryObjectIds = bcs.vector(bcs.Address).parse(new Uint8Array(result.results?.[0]?.returnValues?.[0]?.[0] ?? []))

          const entries = await Promise.all(
            entryObjectIds.map(entryObjectId =>
              suiClient.devInspectTransactionBlock({
                transactionBlock: buildReadEntryTx({
                  entryObjectId,
                }),
                sender: currentAddress,
              }),
            ),
          )

          const res =  (await Promise.allSettled(entries.map(async (vault) => {
            const returnValues = vault.results?.[0]?.returnValues

            const content = await decryptContent(bcs.String.parse(new Uint8Array(returnValues?.[5]?.[0] ?? [])), lockerKey)

            return {
              id: bcs.Address.parse(new Uint8Array(returnValues?.[0]?.[0] ?? [])),
              owner: bcs.Address.parse(new Uint8Array(returnValues?.[1]?.[0] ?? [])),
              vault_id: bcs.Address.parse(new Uint8Array(returnValues?.[2]?.[0] ?? [])),
              name: bcs.String.parse(new Uint8Array(returnValues?.[3]?.[0] ?? [])),
              hash: bcs.String.parse(new Uint8Array(returnValues?.[4]?.[0] ?? [])),
              content,
              entry_type: bcs.option(bcs.String).parse(new Uint8Array(returnValues?.[6]?.[0] ?? [])),
              description: bcs.option(bcs.String).parse(new Uint8Array(returnValues?.[7]?.[0] ?? [])),
              tags: bcs.vector(bcs.String).parse(new Uint8Array(returnValues?.[8]?.[0] ?? [])),
              notes: bcs.option(bcs.String).parse(new Uint8Array(returnValues?.[9]?.[0] ?? [])),
              image_url: bcs.option(bcs.String).parse(new Uint8Array(returnValues?.[10]?.[0] ?? [])),
              link: bcs.option(bcs.String).parse(new Uint8Array(returnValues?.[11]?.[0] ?? [])),
              created_at: parseInt(bcs.U64.parse(new Uint8Array(returnValues?.[12]?.[0] ?? []))),
              updated_at: parseInt(bcs.U64.parse(new Uint8Array(returnValues?.[13]?.[0] ?? []))),
            }
          }))).filter(r => r.status === 'fulfilled').map(r => r.value)

          return res
        }
      : skipToken,
    select: (data) => {
      // Apply filters
      let filteredEntries = data.slice()

      if (filter.vault_id) {
        filteredEntries = filteredEntries.filter(entry => entry.vault_id === filter.vault_id)
      }

      if (filter.entry_type) {
        filteredEntries = filteredEntries.filter(entry => entry.entry_type === filter.entry_type)
      }

      if (filter.tags && filter.tags.length > 0) {
        filteredEntries = filteredEntries.filter(entry =>
          filter.tags?.some(tag => entry.tags.includes(tag)),
        )
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        filteredEntries = filteredEntries.filter(
          entry =>
            entry.name.toLowerCase().includes(searchLower) ||
            entry.content.toLowerCase().includes(searchLower) ||
            (entry.description?.toLowerCase() ?? '').includes(searchLower) ||
            (entry.notes?.toLowerCase() ?? '').includes(searchLower) ||
            entry.tags.some(tag => tag.toLowerCase().includes(searchLower)),
        )
      }

      // Apply sorting
      filteredEntries.sort((a, b) => {
        const aValue = a[sort.field]
        const bValue = b[sort.field]

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue)
          return sort.direction === 'asc' ? comparison : -comparison
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          const comparison = aValue - bValue
          return sort.direction === 'asc' ? comparison : -comparison
        }

        return 0
      })

      return filteredEntries
    }
  })
}
