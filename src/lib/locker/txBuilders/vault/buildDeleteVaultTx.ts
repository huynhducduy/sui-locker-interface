import { Transaction } from "@mysten/sui/transactions";

import { SUI_LOCKER_FUNCTIONS } from "@/constants/sui";
import buildBaseTx from "@/lib/locker/txBuilders/buildBaseTx";

export default function buildDeleteVaultTx({
  vaultId,
}: {
  vaultId: string
}) {
  return buildBaseTx(SUI_LOCKER_FUNCTIONS.DELETE_VAULT, ({globalStateId, target}) => {
    const tx = new Transaction()

    tx.moveCall({
      target,
      arguments: [
        tx.object(vaultId),
        tx.object(globalStateId),
      ],
    })

    return tx
  })
}
