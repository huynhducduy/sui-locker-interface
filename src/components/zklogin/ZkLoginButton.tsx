import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useZkLogin } from '@/lib/zklogin/hooks';
import { OpenIdProvider } from '@/lib/zklogin/types';

interface ZkLoginButtonProps {
  readonly provider: OpenIdProvider;
  readonly rpcUrl: string;
  readonly onSuccess?: (address: string) => void;
  readonly onError?: (error: string) => void;
  readonly className?: string;
}

const getProviderName = (provider: OpenIdProvider): string => {
  switch (provider) {
    case OpenIdProvider.Google:
      return 'Google';
    case OpenIdProvider.Facebook:
      return 'Facebook';
    case OpenIdProvider.Twitch:
      return 'Twitch';
    case OpenIdProvider.Apple:
      return 'Apple';
    case OpenIdProvider.Microsoft:
      return 'Microsoft';
    case OpenIdProvider.Slack:
      return 'Slack';
    case OpenIdProvider.Kakao:
      return 'Kakao';
  }
};

export function ZkLoginButton({
  provider,
  rpcUrl,
  onSuccess,
  onError,
  className,
}: ZkLoginButtonProps) {
  const zkLogin = useZkLogin(rpcUrl);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = useCallback(async () => {
    if (zkLogin.isConnected) {
      // Already connected, maybe disconnect?
      zkLogin.clearSession();
      return;
    }

    setIsLoggingIn(true);

    try {
      // Initialize login and redirect to OAuth provider
      const loginUrl = await zkLogin.initializeLogin(provider);

      // Redirect to OAuth provider
      window.location.href = loginUrl;
    } catch (error) {
      setIsLoggingIn(false);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      onError?.(errorMessage);
    }
  }, [zkLogin, provider, onError]);

  // Handle successful connection
  if (zkLogin.isConnected && zkLogin.address) {
    onSuccess?.(zkLogin.address);
  }

  // Handle errors
  if (zkLogin.error) {
    onError?.(zkLogin.error);
  }

  return (
    <Button
      onClick={handleLogin}
      disabled={zkLogin.isLoading || isLoggingIn}
      className={className}
    >
      {zkLogin.isConnected
        ? `Disconnect from ${getProviderName(provider)}`
        : `${zkLogin.isLoading || isLoggingIn ? 'Connecting...' : 'Connect with'} ${getProviderName(provider)}`
      }
    </Button>
  );
}
