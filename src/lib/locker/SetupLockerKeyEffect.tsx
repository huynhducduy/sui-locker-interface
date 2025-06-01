import { useWallet } from '@suiet/wallet-kit'

import { useGenerateLockerKey } from '@/lib/locker/lockerKey'
import useIsConnected from "@/lib/sui/hooks/useIsConnected"

export default function SetupLockerKeyEffects() {
  const isConnected = useIsConnected()
  const generateLockerKey = useGenerateLockerKey()
  const wallet = useWallet()
  const latestWallet = useLatest(wallet)

  useEffect(() => {
    const wallet = latestWallet.current

    if (isConnected) {
      generateLockerKey().catch(error => {
        console.error('Failed to generate locker key:', error)
        wallet.disconnect()
      })
    }
  }, [isConnected, generateLockerKey])

  return null
}
