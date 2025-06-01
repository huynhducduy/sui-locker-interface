import type { ZkLoginConfig } from './types';

// Get redirect URL safely (avoiding window access in module scope)
function getDefaultRedirectUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  return 'http://localhost:5173/auth/callback'; // fallback for SSR
}

// zkLogin configuration from environment variables
export const zkLoginConfig: ZkLoginConfig = {
  clientId: import.meta.env.VITE_CLIENT_ID ?? '',
  proverUrl: import.meta.env.VITE_PROVER_URL ?? 'https://prover.mystenlabs.com/v1',
  redirectUrl: import.meta.env.VITE_REDIRECT_URL ?? getDefaultRedirectUrl(),
  openIdProviderUrl: '', // Not used - provider URLs are handled by generateLoginUrl utility
};

console.log('zkLoginConfig', zkLoginConfig);

// Validate required environment variables
export function validateZkLoginConfig(): void {
  const requiredVars = [
    { key: 'VITE_CLIENT_ID', value: zkLoginConfig.clientId },
  ];

  const missingVars = requiredVars.filter(({ value }) => !value);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.map(({ key }) => key).join(', ')}`
    );
  }
}
