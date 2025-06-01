import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useZkLogin, useZkLoginCallback } from '@/lib/zklogin/hooks';
import { OpenIdProvider } from '@/lib/zklogin/types';

interface ZkLoginDemoProps {
  readonly rpcUrl: string;
}

export function ZkLoginDemo({ rpcUrl }: ZkLoginDemoProps) {
  const zkLogin = useZkLogin(rpcUrl);
  const zkCallback = useZkLoginCallback();
  const [selectedProvider, setSelectedProvider] = useState<OpenIdProvider>(OpenIdProvider.Google);

  const handleLogin = async () => {
    try {
      const loginUrl = await zkLogin.initializeLogin(selectedProvider);
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGetProof = async () => {
    try {
      const proof = await zkLogin.getProof();
      console.log('ZK Proof:', proof);
    } catch (error) {
      console.error('Failed to get proof:', error);
    }
  };

  const handleProcessCallback = () => {
    if (zkCallback.jwtToken) {
      try {
        const result = zkCallback.processCallback(zkLogin);
        console.log('Callback processed:', result);
      } catch (error) {
        console.error('Failed to process callback:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>zkLogin Demo</CardTitle>
          <CardDescription>
            Demonstrate SUI zkLogin functionality with OAuth providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${zkLogin.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">
              {zkLogin.isConnected ? `Connected: ${zkLogin.address}` : 'Not connected'}
            </span>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select OAuth Provider:</label>
            <select
              value={selectedProvider}
              onChange={(e) => { setSelectedProvider(e.target.value as OpenIdProvider); }}
              className="w-full rounded border p-2"
            >
              <option value={OpenIdProvider.Google}>Google</option>
              <option value={OpenIdProvider.Facebook}>Facebook</option>
              <option value={OpenIdProvider.Twitch}>Twitch</option>
              <option value={OpenIdProvider.Apple}>Apple</option>
              <option value={OpenIdProvider.Microsoft}>Microsoft</option>
              <option value={OpenIdProvider.Slack}>Slack</option>
              <option value={OpenIdProvider.Kakao}>Kakao</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!zkLogin.isConnected ? (
              <Button
                onClick={handleLogin}
                disabled={zkLogin.isLoading}
              >
                {zkLogin.isLoading ? 'Connecting...' : `Login with ${selectedProvider}`}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleGetProof}
                  disabled={zkLogin.isLoading}
                  variant="outline"
                >
                  Get ZK Proof
                </Button>
                <Button
                  onClick={zkLogin.clearSession}
                  variant="destructive"
                >
                  Disconnect
                </Button>
              </>
            )}
          </div>

          {/* Callback Processing */}
          {zkCallback.jwtToken && (
            <div className="space-y-2 rounded border p-3">
              <p className="text-sm font-medium">JWT Token detected in URL</p>
              <Button
                onClick={handleProcessCallback}
                disabled={zkCallback.isProcessing}
                size="sm"
              >
                {zkCallback.isProcessing ? 'Processing...' : 'Process Callback'}
              </Button>
            </div>
          )}

          {/* Error Display */}
          {(zkLogin.error || zkCallback.error) && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Error: {zkLogin.error || zkCallback.error}
            </div>
          )}

          {/* State Display */}
          {zkLogin.state && (
            <details className="space-y-2">
              <summary className="cursor-pointer text-sm font-medium">View State</summary>
              <pre className="overflow-auto rounded bg-gray-100 p-2 text-xs">
                {JSON.stringify(
                  {
                    nonce: zkLogin.state.nonce,
                    maxEpoch: zkLogin.state.maxEpoch,
                    hasJwtToken: !!zkLogin.state.jwtToken,
                    hasProof: !!zkLogin.state.zkProof,
                    address: zkLogin.state.zkLoginAddress,
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
