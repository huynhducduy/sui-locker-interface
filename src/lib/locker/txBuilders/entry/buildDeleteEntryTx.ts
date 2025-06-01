import { Transaction } from "@mysten/sui/transactions";

import { SUI_LOCKER_FUNCTIONS } from "@/constants/sui";
import buildBaseTx from "@/lib/locker/txBuilders/buildBaseTx";

export default function buildDeleteEntryTx({
  vaultId,
  entryId,
}: {
  vaultId: string
  entryId: string
}) {
  return buildBaseTx(SUI_LOCKER_FUNCTIONS.DELETE_ENTRY, ({globalStateId, target}) => {
    const tx = new Transaction()

    tx.moveCall({
      target,
      arguments: [
        tx.object(entryId),
        tx.object(vaultId),
        tx.object(globalStateId),
      ],
    })

    return tx
  })
}
