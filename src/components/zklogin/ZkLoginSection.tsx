import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useZkLogin } from '@/lib/zklogin/hooks';
import { OpenIdProvider } from '@/lib/zklogin/types';

const providers = [
  {
    provider: OpenIdProvider.Google,
    name: 'Google',
    icon: '🌐',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    provider: OpenIdProvider.Facebook,
    name: 'Facebook',
    icon: '📘',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    provider: OpenIdProvider.Twitch,
    name: 'Twitch',
    icon: '💜',
    color: 'bg-purple-600 hover:bg-purple-700',
  },
  {
    provider: OpenIdProvider.Apple,
    name: 'Apple',
    icon: '🍎',
    color: 'bg-gray-800 hover:bg-gray-900',
  },
  {
    provider: OpenIdProvider.Microsoft,
    name: 'Microsoft',
    icon: '🪟',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
];

interface ZkLoginSectionProps {
  onSuccess?: (address: string) => void;
  onError?: (error: string) => void;
}

export function ZkLoginSection({ onSuccess, onError }: ZkLoginSectionProps) {
  const zkLogin = useZkLogin('https://fullnode.testnet.sui.io:443');
  const [connectingProvider, setConnectingProvider] = useState<OpenIdProvider | null>(null);

  const handleProviderLogin = useCallback(async (provider: OpenIdProvider) => {
    setConnectingProvider(provider);

    try {
      const loginUrl = await zkLogin.initializeLogin(provider);
      console.log('Generated login URL:', loginUrl); // Debug log
      // Redirect to the OAuth provider
      window.location.href = loginUrl;
    } catch (error) {
      setConnectingProvider(null);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('zkLogin error:', error); // Debug log
      toast.error(`Failed to connect with ${providers.find(p => p.provider === provider)?.name}: ${errorMessage}`);
      onError?.(errorMessage);
    }
  }, [zkLogin, onError]);

  // Handle successful connection
  if (zkLogin.isConnected && zkLogin.address) {
    onSuccess?.(zkLogin.address);
  }

  // Handle errors
  if (zkLogin.error) {
    console.error('zkLogin hook error:', zkLogin.error); // Debug log
    toast.error(`zkLogin error: ${zkLogin.error}`);
    onError?.(zkLogin.error);
  }

  const handleProviderClick = useCallback((provider: OpenIdProvider) => {
    void handleProviderLogin(provider);
  }, [handleProviderLogin]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          🔐 zkLogin
        </CardTitle>
        <CardDescription>
          Connect with your social account using zero-knowledge proofs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {providers.map(({ provider, name, icon, color }) => (
            <Button
              key={provider}
              onClick={() => { handleProviderClick(provider); }}
              disabled={zkLogin.isLoading || connectingProvider !== null}
              className={`w-full justify-start ${color} text-white`}
              variant="default"
            >
              <span className="text-lg mr-3">{icon}</span>
              {connectingProvider === provider ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                `Continue with ${name}`
              )}
            </Button>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            zkLogin uses zero-knowledge proofs to authenticate without revealing your identity
          </p>
        </div>

        {zkLogin.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{zkLogin.error}</p>
            <details className="mt-2">
              <summary className="text-xs cursor-pointer">Debug Info</summary>
              <pre className="text-xs mt-1 overflow-auto">{JSON.stringify({
                clientId: import.meta.env.VITE_CLIENT_ID ? 'Set' : 'Missing',
                redirectUrl: import.meta.env.VITE_REDIRECT_URL ?? 'Using default',
                proverUrl: import.meta.env.VITE_PROVER_URL ?? 'Using default',
              }, null, 2)}</pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
