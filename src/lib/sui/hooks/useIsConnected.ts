import { useWallet } from "@suiet/wallet-kit"

export default function useIsConnected() {
  const wallet = useWallet()
  return wallet.connected
}
