import { Transaction } from "@mysten/sui/transactions";

import { SUI_LOCKER_FUNCTIONS } from "@/constants/sui";
import buildBaseTx from "@/lib/locker/txBuilders/buildBaseTx";

export default function buildListVaultTx({
  userAddress,
}: {
  userAddress: string
}) {
  return buildBaseTx(SUI_LOCKER_FUNCTIONS.GET_USER_VAULTS, ({globalStateId, target}) => {
    const tx = new Transaction()

    tx.moveCall({
      target,
      arguments: [
        tx.object(globalStateId),
        tx.pure.address(userAddress),
      ],
    })

    return tx
  })
}
