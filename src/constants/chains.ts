/**
 * Supported blockchain chains for the SuiLocker interface
 * Currently placeholder values for future blockchain integration
 */

export const DEFAULT_CHAIN_ID: string = 'localhost'

export const SUPPORTED_CHAINS: {chainId: string; name: string}[] = [
  {
    chainId: 'localhost',
    name: 'Local Development',
  },
  // Future blockchain chains will be added here
  // {
  //   chainId: 'mainnet',
  //   name: 'Mainnet',
  // },
  // {chainId: 'testnet', name: 'Testnet'},
] as const

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map(chain => chain.chainId)

export function isChainIdSupported(chainId: unknown): chainId is string {
  return SUPPORTED_CHAIN_IDS.includes(chainId as string)
}
