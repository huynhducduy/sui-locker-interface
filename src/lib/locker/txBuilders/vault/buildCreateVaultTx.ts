import { Transaction } from "@mysten/sui/transactions";

import { SUI_LOCKER_FUNCTIONS } from "@/constants/sui";
import buildBaseTx from "@/lib/locker/txBuilders/buildBaseTx";

export default function buildCreateVaultTx({
  name,
  description,
  imageUrl,
}: {
  name: string
  description?: string | undefined
  imageUrl?: string | undefined
}) {
  return buildBaseTx(SUI_LOCKER_FUNCTIONS.CREATE_VAULT, ({globalStateId, target}) => {
    const tx = new Transaction()

    tx.moveCall({
      target,
      arguments: [
        tx.pure.string(name),
        tx.pure.string(description ?? ''),
        tx.pure.string(imageUrl ?? ''),
        tx.object(globalStateId),
        tx.object('0x6'),
      ],
    })

    return tx
  })
}
