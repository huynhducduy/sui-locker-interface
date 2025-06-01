import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useZkLogin, useZkLoginCallback } from '@/lib/zklogin/hooks';

interface DebugInfo {
  hasSessionData: boolean;
  sessionDataLength: number;
  hasJwtToken: boolean;
  zkLoginServiceReady: boolean;
  zkLoginState: boolean;
  zkLoginError: string | null;
  urlParams: Record<string, string>;
  hashParams: Record<string, string>;
  currentUrl: string;
}

function AuthCallback() {
  const { jwtToken, isProcessing, error, processCallback } = useZkLoginCallback();
  const zkLogin = useZkLogin('https://fullnode.testnet.sui.io:443'); // Using Sui testnet
  const [hasAttemptedProcessing, setHasAttemptedProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  // Enhanced session validation and recovery
  useEffect(() => {
    const checkSessionAndProcess = async () => {
      // Enhanced debugging
      const sessionData = sessionStorage.getItem('zklogin_state');
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));

      const debugData: DebugInfo = {
        hasSessionData: !!sessionData,
        sessionDataLength: sessionData?.length ?? 0,
        hasJwtToken: !!jwtToken,
        zkLoginServiceReady: zkLogin.isServiceReady,
        zkLoginState: !!zkLogin.state,
        zkLoginError: zkLogin.error,
        urlParams: Object.fromEntries(urlParams.entries()),
        hashParams: Object.fromEntries(hashParams.entries()),
        currentUrl: window.location.href,
      };

      setDebugInfo(debugData);
      console.debug('Auth callback debug info:', debugData);

      // Check for both session data and JWT token
      if (!sessionData && !jwtToken) {
        console.error('No session data found in storage and no JWT token. User may need to start login flow again.');
        toast.error('Login session not found. Please try logging in again.');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      // If we have JWT but no session data, this might be a browser storage issue
      if (!sessionData && jwtToken) {
        console.warn('No session data found but JWT token is present. This may be due to browser storage limitations during OAuth redirect.');
        toast.info('Session data was lost during login. Please try again if authentication fails.');
      }

      // Wait for zkLogin service to be ready and ensure session is restored
      if (!zkLogin.isServiceReady) {
        console.log('Waiting for zkLogin service to be ready...');
        return; // useEffect will run again when isServiceReady changes
      }

      // If service is ready but state is missing, try to manually restore session
      if (!zkLogin.state && sessionData) {
        console.warn('zkLogin service is ready but session state is missing. Attempting manual restoration...');

        // Try to parse session data to check if it's valid
        try {
          const parsed = JSON.parse(sessionData) as {
            ephemeralKeyPair?: unknown;
            randomness?: string;
            nonce?: string;
            [key: string]: unknown;
          };

          if (!parsed.ephemeralKeyPair || !parsed.randomness || !parsed.nonce) {
            console.error('Session data is incomplete or corrupted');
            toast.error('Login session corrupted. Please try logging in again.');
            sessionStorage.removeItem('zklogin_state');
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
            return;
          }

          // Try to force restoration
          console.log('Attempting forced session restoration...');
          const restoreResult = zkLogin.forceRestoreSession();

          if (!restoreResult.success) {
            console.error('Forced session restoration failed:', restoreResult.error);
            toast.error('Unable to restore login session. Please try logging in again.');
            sessionStorage.removeItem('zklogin_state');
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
            return;
          }

          console.log('Forced session restoration successful');

          // Continue to verify state is now available
          if (!zkLogin.state) {
            console.error('zkLogin state is still missing after forced restoration');
            toast.error('Unable to restore login session. Please try logging in again.');
            sessionStorage.removeItem('zklogin_state');
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
            return;
          }
        } catch (parseError) {
          console.error('Failed to parse session data:', parseError);
          toast.error('Login session data is corrupted. Please try logging in again.');
          sessionStorage.removeItem('zklogin_state');
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
          return;
        }
      }

      // At this point we should have both JWT token and zkLogin state
      if (!jwtToken) {
        console.error('No JWT token found in URL');
        toast.error('No authentication token found. Please try logging in again.');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      if (!zkLogin.state) {
        console.error('zkLogin state is still missing after restoration attempts');
        toast.error('Unable to restore login session. Please try logging in again.');
        sessionStorage.removeItem('zklogin_state');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      // Process the JWT token
      try {
        console.debug('Processing JWT with session state:', {
          hasState: !!zkLogin.state,
          hasEphemeralKeyPair: !!zkLogin.state?.ephemeralKeyPair,
          hasRandomness: !!zkLogin.state?.randomness,
          hasNonce: !!zkLogin.state?.nonce,
          maxEpoch: zkLogin.state?.maxEpoch,
        });

        const result = processCallback(zkLogin);
        if (result.address) {
          toast.success(`Successfully authenticated with address: ${result.address}`);
          // Redirect to home page after successful authentication
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        }
      } catch (err) {
        console.error('Authentication failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';

        // Provide more specific error messages based on the error type
        if (errorMessage.includes('zkLogin session not initialized')) {
          toast.error('Login session expired or corrupted. Please try logging in again.');
          sessionStorage.removeItem('zklogin_state');
        } else if (errorMessage.includes('session is incomplete')) {
          toast.error('Login session is incomplete. Please try logging in again.');
          sessionStorage.removeItem('zklogin_state');
        } else if (errorMessage.includes('Missing ephemeral keypair')) {
          toast.error('Login session data corrupted. Please try logging in again.');
          sessionStorage.removeItem('zklogin_state');
        } else {
          toast.error(`Authentication failed: ${errorMessage}`);
        }

        // Redirect back to home page on error
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    };

    // Only attempt processing when we have JWT token and haven't tried yet
    if (jwtToken && !isProcessing && !hasAttemptedProcessing) {
      setHasAttemptedProcessing(true);
      void checkSessionAndProcess();
    }
  }, [jwtToken, isProcessing, hasAttemptedProcessing, zkLogin.isServiceReady, zkLogin.state, processCallback, zkLogin]);

  useEffect(() => {
    if (error) {
      toast.error(`Authentication error: ${error}`);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  }, [error]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <h2 className="text-xl font-semibold">Processing authentication...</h2>
          <p className="text-muted-foreground">Please wait while we complete your sign-in.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-red-600">Authentication Failed</h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting you back...</p>

          {debugInfo && (
            <details className="text-left text-xs bg-gray-100 p-4 rounded border">
              <summary className="cursor-pointer font-medium">Debug Information (Click to expand)</summary>
              <div className="mt-2 space-y-2">
                <div><strong>Session Data:</strong> {debugInfo.hasSessionData ? 'Found' : 'Missing'}</div>
                <div><strong>JWT Token:</strong> {debugInfo.hasJwtToken ? 'Found' : 'Missing'}</div>
                <div><strong>Service Ready:</strong> {debugInfo.zkLoginServiceReady ? 'Yes' : 'No'}</div>
                <div><strong>State Restored:</strong> {debugInfo.zkLoginState ? 'Yes' : 'No'}</div>
                {debugInfo.zkLoginError && <div><strong>zkLogin Error:</strong> {debugInfo.zkLoginError}</div>}
                <div><strong>Current URL:</strong> {debugInfo.currentUrl}</div>
                {Object.keys(debugInfo.urlParams).length > 0 && (
                  <div><strong>URL Params:</strong> {JSON.stringify(debugInfo.urlParams, null, 2)}</div>
                )}
                {Object.keys(debugInfo.hashParams).length > 0 && (
                  <div><strong>Hash Params:</strong> {JSON.stringify(debugInfo.hashParams, null, 2)}</div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  if (!jwtToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Invalid Authentication</h2>
          <p className="text-muted-foreground">No authentication token found.</p>
          <p className="text-sm text-muted-foreground">Redirecting you back...</p>
          {debugInfo && (
            <details className="text-left text-xs bg-gray-100 p-2 rounded">
              <summary>Debug Information</summary>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  // Show loading while waiting for service to be ready
  if (!zkLogin.isServiceReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <h2 className="text-xl font-semibold">Preparing authentication...</h2>
          <p className="text-muted-foreground">Initializing login service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <h2 className="text-xl font-semibold">Authentication Complete</h2>
        <p className="text-muted-foreground">Redirecting you to the app...</p>
        {debugInfo && process.env.NODE_ENV === 'development' && (
          <details className="text-left text-xs bg-gray-100 p-2 rounded">
            <summary>Debug Information</summary>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
});
