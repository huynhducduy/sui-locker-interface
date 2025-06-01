import { useWallet } from '@suiet/wallet-kit';
import { createContext, type ReactNode,use, useCallback, useMemo } from 'react';

import { useZkLogin } from '@/lib/zklogin/hooks';

export type AuthMethod = 'wallet' | 'zklogin';

export interface AuthState {
  isConnected: boolean;
  address: string | null;
  method: AuthMethod | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  // Wallet methods
  disconnectWallet: () => void;

  // zkLogin methods
  zkLogin: ReturnType<typeof useZkLogin>;

  // Unified methods
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const wallet = useWallet();
  const zkLogin = useZkLogin('https://fullnode.testnet.sui.io:443');

  const authState: AuthState = useMemo(() => {
    // Determine the primary authentication method
    if (zkLogin.isConnected && zkLogin.address) {
      return {
        isConnected: true,
        address: zkLogin.address,
        method: 'zklogin',
        isLoading: zkLogin.isLoading,
        error: zkLogin.error,
      };
    }

    if (wallet.connected && wallet.account?.address) {
      return {
        isConnected: true,
        address: wallet.account.address,
        method: 'wallet',
        isLoading: false,
        error: null,
      };
    }

    return {
      isConnected: false,
      address: null,
      method: null,
      isLoading: wallet.connecting || zkLogin.isLoading,
      error: zkLogin.error,
    };
  }, [
    wallet.connected,
    wallet.connecting,
    wallet.account?.address,
    zkLogin.isConnected,
    zkLogin.address,
    zkLogin.isLoading,
    zkLogin.error,
  ]);

  const disconnect = useCallback(() => {
    if (authState.method === 'wallet') {
      wallet.disconnect();
    } else if (authState.method === 'zklogin') {
      zkLogin.clearSession();
    }
  }, [authState.method, wallet, zkLogin]);

  const contextValue: AuthContextValue = useMemo(() => ({
    ...authState,
    disconnectWallet: wallet.disconnect,
    zkLogin,
    disconnect,
  }), [authState, wallet.disconnect, zkLogin, disconnect]);

  return (
    <AuthContext value={contextValue}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useIsAuthenticated(): boolean {
  const { isConnected } = useAuth();
  return isConnected;
}

export function useCurrentAddress(): string | null {
  const { address } = useAuth();
  return address;
}

export function useAuthMethod(): AuthMethod | null {
  const { method } = useAuth();
  return method;
}
