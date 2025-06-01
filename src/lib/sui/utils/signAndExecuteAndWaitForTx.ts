import type { Transaction } from "@mysten/sui/transactions";
import { useSuiClient,useWallet } from "@suiet/wallet-kit";

export default async function signAndExecuteAndWaitForTx(wallet: ReturnType<typeof useWallet>, suiClient: ReturnType<typeof useSuiClient>, tx: Transaction) {
  const output = await wallet.signAndExecuteTransaction({
    transaction: tx,
  })

  return suiClient.waitForTransaction({
    digest: output.digest,
  })
}
