import { Transaction } from '@mysten/sui/transactions';
import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useCallback, useEffect, useState } from 'react';

import { validateZkLoginConfig, zkLoginConfig } from './config';
import { ZkLoginService } from './service';
import type { LoginUrlConfig, OpenIdProvider, ZkLoginState } from './types';
import { decodeJwt, extractJwtFromUrl, generateLoginUrl } from './utils';

// Error message constants
const ERROR_SERVICE_NOT_INITIALIZED = 'zkLogin service not initialized';

// Global state for zkLogin (service is not stored, only state)
const zkLoginServiceAtom = atom<ZkLoginService | null>(null);
const zkLoginStateAtom = atomWithStorage<ZkLoginState | null>('zklogin_state', null);
const zkLoginAddressAtom = atomWithStorage<string | null>('zklogin_address', null);

/**
 * Main hook for zkLogin functionality
 */
export function useZkLogin(rpcUrl?: string) {
  const [service, setService] = useAtom(zkLoginServiceAtom);
  const [state, setState] = useAtom(zkLoginStateAtom);
  const [address, setAddress] = useAtom(zkLoginAddressAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isServiceReady, setIsServiceReady] = useState(false);

  // Initialize service
  useEffect(() => {
    if (!service && rpcUrl) {
      try {
        console.debug('Initializing zkLogin service with RPC URL:', rpcUrl);
        validateZkLoginConfig();
        const zkService = new ZkLoginService(rpcUrl);

        // Try to restore session
        const restored = zkService.restoreSession();
        console.debug('Session restoration result:', restored);

        if (restored) {
          const restoredState = zkService.getState();
          console.debug('Restored state:', {
            hasState: !!restoredState,
            hasJwtToken: !!restoredState?.jwtToken,
            hasAddress: !!restoredState?.zkLoginAddress,
            maxEpoch: restoredState?.maxEpoch,
          });
          setState(restoredState);
          setAddress(zkService.getAddress());
        } else {
          // If restoration failed, clear any existing state atoms
          // but don't clear session storage (the service already handles that)
          setState(null);
          setAddress(null);
        }

        setService(zkService);
        setIsServiceReady(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize zkLogin';
        console.error('zkLogin initialization error:', err);
        setError(errorMessage);
        setIsServiceReady(false);
      }
    }
  }, [service, rpcUrl, setService, setState, setAddress]);

  /**
   * Initialize zkLogin session and get login URL
   */
  const initializeLogin = useCallback(async (provider: OpenIdProvider): Promise<string> => {
    if (!service) throw new Error(ERROR_SERVICE_NOT_INITIALIZED);

    setIsLoading(true);
    setError(null);

    try {
      const { nonce } = await service.initializeSession();

      const loginUrl = generateLoginUrl({
        provider,
        clientId: zkLoginConfig.clientId,
        redirectUrl: zkLoginConfig.redirectUrl,
        nonce,
      });

      setState(service.getState());
      return loginUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize login';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, setState]);

  /**
   * Process JWT token after OAuth callback
   */
  const processJwt = useCallback((jwtToken: string, userSalt?: string): string => {
    if (!service) throw new Error(ERROR_SERVICE_NOT_INITIALIZED);

    // Additional check to ensure service has a valid state for processing
    const serviceState = service.getState();
    if (!serviceState?.ephemeralKeyPair || !serviceState.randomness || !serviceState.nonce) {
      throw new Error('zkLogin session not initialized. Call initializeSession() first.');
    }

    console.debug('Processing JWT token', {
      hasService: !!service,
      hasState: !!serviceState,
      serviceStateDetails: {
        hasEphemeralKeyPair: !!serviceState.ephemeralKeyPair,
        hasRandomness: !!serviceState.randomness,
        hasNonce: !!serviceState.nonce,
        maxEpoch: serviceState.maxEpoch,
      },
    });

    setIsLoading(true);
    setError(null);

    try {
      const zkLoginAddress = service.processJwtToken(jwtToken, userSalt);

      setState(service.getState());
      setAddress(zkLoginAddress);

      console.debug('JWT processing completed successfully', {
        address: zkLoginAddress,
      });

      return zkLoginAddress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process JWT';
      console.error('JWT processing failed:', err);
      console.error('Service state at time of error:', service.getState());
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, setState, setAddress]);

  /**
   * Get zero-knowledge proof
   */
  const getProof = useCallback(async () => {
    if (!service) throw new Error(ERROR_SERVICE_NOT_INITIALIZED);

    setIsLoading(true);
    setError(null);

    try {
      const proof = await service.getZkProof();
      setState(service.getState());
      return proof;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get ZK proof';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, setState]);

  /**
   * Execute transaction using zkLogin
   */
  const executeTransaction = useCallback(async (transaction: Transaction) => {
    if (!service) throw new Error(ERROR_SERVICE_NOT_INITIALIZED);

    setIsLoading(true);
    setError(null);

    try {
      const result = await service.executeTransaction(transaction);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute transaction';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  /**
   * Check if session is valid
   */
  const isSessionValid = useCallback(async (): Promise<boolean> => {
    if (!service) return false;
    return await service.isSessionValid();
  }, [service]);

  /**
   * Clear current session
   */
  const clearSession = useCallback(() => {
    if (service) {
      service.clearSession();
    }
    setState(null);
    setAddress(null);
    setError(null);
  }, [service, setState, setAddress]);

  /**
   * Force session restoration - useful for callback scenarios
   */
  const forceRestoreSession = useCallback(() => {
    if (!service) throw new Error(ERROR_SERVICE_NOT_INITIALIZED);

    const result = service.forceRestoreSession();
    if (result.success) {
      const restoredState = service.getState();
      setState(restoredState);
      setAddress(service.getAddress());
      console.debug('Forced session restoration successful');
    } else {
      console.warn('Forced session restoration failed:', result.error);
    }

    return result;
  }, [service, setState, setAddress]);

  return {
    // State
    isConnected: !!address,
    address,
    state,
    isLoading,
    error,
    isServiceReady,

    // Actions
    initializeLogin,
    processJwt,
    getProof,
    executeTransaction,
    isSessionValid,
    clearSession,
    forceRestoreSession,
  };
}

/**
 * Hook for handling OAuth callback
 */
export function useZkLoginCallback() {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract JWT from current URL
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentUrl = window.location.href;
    const extractedJwt = extractJwtFromUrl(currentUrl);

    if (extractedJwt) {
      setJwtToken(extractedJwt);
    }
  }, []);

  /**
   * Process the JWT token from the callback
   */
  const processCallback = useCallback((zkLogin: ReturnType<typeof useZkLogin>, userSalt?: string) => {
    if (!jwtToken) {
      throw new Error('No JWT token found in callback URL');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Validate JWT first
      const decoded = decodeJwt(jwtToken);

      // Process with zkLogin
      const address = zkLogin.processJwt(jwtToken, userSalt);

      return { address, decodedJwt: decoded };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process callback';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [jwtToken]);

  return {
    jwtToken,
    isProcessing,
    error,
    processCallback,
  };
}

/**
 * Hook for generating login URLs for different providers
 */
export function useZkLoginProviders() {
  const generateProviderUrl = useCallback((config: Omit<LoginUrlConfig, 'clientId' | 'redirectUrl'>) => {
    return generateLoginUrl({
      ...config,
      clientId: zkLoginConfig.clientId,
      redirectUrl: zkLoginConfig.redirectUrl,
    });
  }, []);

  return {
    generateProviderUrl,
  };
}
