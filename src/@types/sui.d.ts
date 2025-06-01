import { type SuiClient } from "@mysten/sui/client";

declare module '@suiet/wallet-kit' {
  function useSuiClient(): SuiClient
}
