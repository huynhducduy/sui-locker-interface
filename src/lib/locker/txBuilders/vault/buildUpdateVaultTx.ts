import { Transaction } from "@mysten/sui/transactions";

import { SUI_LOCKER_FUNCTIONS } from "@/constants/sui";
import buildBaseTx from "@/lib/locker/txBuilders/buildBaseTx";

export default function buildUpdateVaultTx({
  vaultId,
  name,
  description,
  imageUrl,
}: {
  vaultId: string
  name: string
  description?: string | undefined | null
  imageUrl?: string | undefined | null
}) {
  return buildBaseTx(SUI_LOCKER_FUNCTIONS.UPDATE_VAULT, ({target}) => {
    const tx = new Transaction()

    tx.moveCall({
      target,
      arguments: [
        tx.object(vaultId),
        tx.pure.option('string', name),
        tx.pure.option('option<string>', description),
        tx.pure.option('option<string>', imageUrl),
        tx.object('0x6'),
      ],
    })

    return tx
  })
}
