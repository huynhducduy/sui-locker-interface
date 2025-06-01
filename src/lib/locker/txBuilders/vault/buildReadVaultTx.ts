import { Transaction } from "@mysten/sui/transactions";

import { SUI_LOCKER_FUNCTIONS } from "@/constants/sui";
import buildBaseTx from "@/lib/locker/txBuilders/buildBaseTx";

export default function buildReadVaultTx({
  vaultObjectId
}: {
  vaultObjectId: string
}) {
  return buildBaseTx(SUI_LOCKER_FUNCTIONS.GET_VAULT_INFO, ({target}) => {
    const tx = new Transaction()

    tx.moveCall({
      target,
      arguments: [
        tx.object(vaultObjectId),
      ],
    })

    return tx
  })
}
