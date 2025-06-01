import { useWallet } from "@suiet/wallet-kit"
import {User, Wallet, X} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useUserStatsQuery from "@/lib/locker/hooks/useUserStatsQuery"

export default function ConnectedWalletInfo() {
  const wallet = useWallet()
  const address = wallet.address
  const {data: userStats} = useUserStatsQuery()

  const handleDisconnect = useCallback(() => {
    wallet.disconnect()
  }, [wallet])

  if (!address) {
    return null
  }

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="lg" className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">
            {formatAddress(address)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-medium">Connected Account</div>
              <div className="text-muted-foreground text-xs font-mono">
                {formatAddress(address)}
              </div>
            </div>
          </div>

          {userStats && (
            <div className="pt-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Vaults:</span>
                <span>{userStats.vault_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Entries:</span>
                <span>{userStats.entry_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Tags:</span>
                <span>{userStats.unique_tags_count}</span>
              </div>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleDisconnect}
          className="text-destructive-foreground focus:text-destructive-foreground focus:bg-destructive/50"
        >
          <X className="h-4 w-4 text-destructive-foreground" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
