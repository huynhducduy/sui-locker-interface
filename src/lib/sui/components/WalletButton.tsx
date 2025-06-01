import { ConnectButton } from '@suiet/wallet-kit'

import useIsConnected from '@/lib/sui/hooks/useIsConnected'

import ConnectedWalletInfo from './ConnectedWalletInfo'

interface WalletButtonProps {
  className?: string
}

export default function WalletButton({className}: WalletButtonProps) {
  const isConnected = useIsConnected()

  if (!isConnected) {
    return (
      <div className={className}>
        <ConnectButton label="Connect Wallet" />
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ConnectedWalletInfo />
    </div>
  )
}
