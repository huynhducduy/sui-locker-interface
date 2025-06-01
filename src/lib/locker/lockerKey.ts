import { useWallet } from "@suiet/wallet-kit"

const DEFINED_LOCKER_KEY = Uint8Array.from('Login to Sui Locker', c => c.charCodeAt(0))

export const lockerKeyAtom = atom<string>()

export default function useLockerKey() {
  return useAtom(lockerKeyAtom)
}

export function useSetLockerKey() {
  return useSetAtom(lockerKeyAtom)
}

export function useLockerKeyValue() {
  return useAtomValue(lockerKeyAtom)
}

export function useGenerateLockerKey() {
  const wallet = useWallet()
  const latestWallet = useLatest(wallet)
  const setLockerKey = useSetLockerKey()

  const generateLockerKey = useCallback(async () => {
    const key = await latestWallet.current.signPersonalMessage({
      message: DEFINED_LOCKER_KEY
    })
    setLockerKey(key.signature)
  }, [setLockerKey])

  return generateLockerKey
}
