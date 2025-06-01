import {bcs} from '@mysten/sui/bcs'
import {useSuiClient} from '@suiet/wallet-kit'

import buildListVaultTx from '@/lib/locker/txBuilders/vault/buildListVaultsTx'
import buildReadVaultTx from '@/lib/locker/txBuilders/vault/buildReadVaultTx'
import useCurrentAddress from '@/lib/sui/hooks/useCurrentAddress'

export function getVaultsQueryKey(address: string | null) {
  return ['vaults', address]
}

export default function useVaultsQuery() {
  const currentAddress = useCurrentAddress()

  const suiClient = useSuiClient()

  return useQuery({
    queryKey: getVaultsQueryKey(currentAddress),
    queryFn: currentAddress
      ? async () => {
          const result = await suiClient.devInspectTransactionBlock({
            transactionBlock: buildListVaultTx({
              userAddress: currentAddress,
            }),
            sender: currentAddress,
          })

          const vaultObjectIds = bcs.vector(bcs.Address).parse(new Uint8Array(result.results?.[0]?.returnValues?.[0]?.[0] ?? []))

          const vaults = await Promise.all(
            vaultObjectIds.map(vaultObjectId =>
              suiClient.devInspectTransactionBlock({
                transactionBlock: buildReadVaultTx({
                  vaultObjectId,
                }),
                sender: currentAddress,
              }),
            ),
          )

          return vaults.map(vault => {
            const returnValues = vault.results?.[0]?.returnValues

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
          })
        }
      : skipToken,
    throwOnError: false,
  })
}
