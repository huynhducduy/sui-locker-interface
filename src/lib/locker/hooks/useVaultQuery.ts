import {bcs} from '@mysten/sui/bcs'
import {useSuiClient} from '@suiet/wallet-kit'

import buildReadVaultTx from '@/lib/locker/txBuilders/vault/buildReadVaultTx'
import useCurrentAddress from '@/lib/sui/hooks/useCurrentAddress'

export function getVaultQueryKey(address: string | null, vaultId: string) {
  return ['vault', address, vaultId]
}

export default function useVaultQuery(vaultObjectId: string) {
  const currentAddress = useCurrentAddress()

  const suiClient = useSuiClient()

  return useQuery({
    queryKey: getVaultQueryKey(currentAddress, vaultObjectId),
    queryFn: currentAddress
      ? async () => {
          const result = await suiClient.devInspectTransactionBlock({
            transactionBlock: buildReadVaultTx({
              vaultObjectId,
            }),
            sender: currentAddress,
          })

          const returnValues = result.results?.[0]?.returnValues

          return {
            id: bcs.Address.parse(new Uint8Array(returnValues?.[0]?.[0] ?? [])),
            owner: bcs.Address.parse(new Uint8Array(returnValues?.[1]?.[0] ?? [])),
            name: bcs.String.parse(new Uint8Array(returnValues?.[2]?.[0] ?? [])),
            description: bcs.option(bcs.String).parse(new Uint8Array(returnValues?.[3]?.[0] ?? [])),
            image_url: bcs.option(bcs.String).parse(new Uint8Array(returnValues?.[4]?.[0] ?? [])),
            created_at: parseInt(bcs.U64.parse(new Uint8Array(returnValues?.[5]?.[0] ?? []))),
            updated_at: parseInt(bcs.U64.parse(new Uint8Array(returnValues?.[6]?.[0] ?? []))),
            entry_count: parseInt(bcs.U64.parse(new Uint8Array(returnValues?.[7]?.[0] ?? []))),
          }
        }
      : skipToken,
  })
}
