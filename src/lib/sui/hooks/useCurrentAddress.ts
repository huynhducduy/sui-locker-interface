import { useWallet } from "@suiet/wallet-kit";

export default function useCurrentAddress(){
  const wallet = useWallet()
  return wallet.account?.address ?? null;
}
