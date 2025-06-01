# SUI zkLogin Implementation

A complete TypeScript implementation of SUI's zkLogin functionality for seamless OAuth-based authentication with zero-knowledge proofs.

## Features

- 🔐 **OAuth Integration**: Support for Google, Facebook, Twitch, Apple, Microsoft, Slack, and Kakao
- 🛡️ **Zero-Knowledge Proofs**: Generate and verify ZK proofs for privacy-preserving authentication
- ⚡ **React Hooks**: Easy-to-use hooks for React applications
- 💾 **Session Management**: Automatic session persistence and restoration
- 🔄 **Transaction Signing**: Sign and execute SUI transactions using zkLogin
- 📱 **SSR Compatible**: Works with server-side rendering

## Environment Variables

Create a `.env` file with the following variables:

```env
# Required
VITE_CLIENT_ID=your_oauth_client_id
VITE_REDIRECT_URL=http://localhost:5173/auth/callback

# Optional
VITE_PROVER_URL=https://prover.mystenlabs.com/v1
VITE_OPENID_PROVIDER_URL=https://accounts.google.com/o/oauth2/v2/auth
```

## Quick Start

### 1. Basic Usage with Hooks

```tsx
import { useZkLogin } from '@/lib/zklogin/hooks';
import { OpenIdProvider } from '@/lib/zklogin/types';

function LoginComponent() {
  const zkLogin = useZkLogin('https://fullnode.mainnet.sui.io:443');

  const handleLogin = async () => {
    try {
      const loginUrl = await zkLogin.initializeLogin(OpenIdProvider.Google);
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      {zkLogin.isConnected ? (
        <div>
          <p>Connected: {zkLogin.address}</p>
          <button onClick={zkLogin.clearSession}>Disconnect</button>
        </div>
      ) : (
        <button onClick={handleLogin} disabled={zkLogin.isLoading}>
          {zkLogin.isLoading ? 'Connecting...' : 'Login with Google'}
        </button>
      )}
    </div>
  );
}
```

### 2. Handle OAuth Callback

```tsx
import { useZkLogin, useZkLoginCallback } from '@/lib/zklogin/hooks';

function CallbackPage() {
  const zkLogin = useZkLogin('https://fullnode.mainnet.sui.io:443');
  const zkCallback = useZkLoginCallback();

  useEffect(() => {
    if (zkCallback.jwtToken) {
      try {
        const result = zkCallback.processCallback(zkLogin);
        console.log('Login successful:', result);
        // Redirect to main app
        window.location.href = '/';
      } catch (error) {
        console.error('Callback processing failed:', error);
      }
    }
  }, [zkCallback.jwtToken, zkLogin]);

  return <div>Processing login...</div>;
}
```

### 3. Execute Transactions

```tsx
import { Transaction } from '@mysten/sui/transactions';

function TransactionComponent() {
  const zkLogin = useZkLogin('https://fullnode.mainnet.sui.io:443');

  const handleTransaction = async () => {
    if (!zkLogin.isConnected) return;

    try {
      // Get ZK proof first
      await zkLogin.getProof();

      // Create and execute transaction
      const tx = new Transaction();
      // ... add transaction commands

      const result = await zkLogin.executeTransaction(tx);
      console.log('Transaction successful:', result);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <button
      onClick={handleTransaction}
      disabled={!zkLogin.isConnected || zkLogin.isLoading}
    >
      Execute Transaction
    </button>
  );
}
```

## API Reference

### Hooks

#### `useZkLogin(rpcUrl?: string)`

Main hook for zkLogin functionality.

**Returns:**
- `isConnected: boolean` - Connection status
- `address: string | null` - zkLogin address
- `state: ZkLoginState | null` - Current session state
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message
- `initializeLogin(provider: OpenIdProvider): Promise<string>` - Initialize OAuth login
- `processJwt(jwtToken: string, userSalt?: string): string` - Process JWT token
- `getProof(): Promise<PartialZkLoginSignature>` - Get ZK proof
- `executeTransaction(transaction: Transaction): Promise<TransactionResult>` - Execute transaction
- `isSessionValid(): Promise<boolean>` - Check session validity
- `clearSession(): void` - Clear current session

#### `useZkLoginCallback()`

Hook for handling OAuth callbacks.

**Returns:**
- `jwtToken: string | null` - Extracted JWT token
- `isProcessing: boolean` - Processing state
- `error: string | null` - Error message
- `processCallback(zkLogin, userSalt?): { address: string, decodedJwt: JwtPayload }` - Process callback

#### `useZkLoginProviders()`

Hook for generating provider URLs.

**Returns:**
- `generateProviderUrl(config): string` - Generate OAuth URL

### Components

#### `ZkLoginButton`

Pre-built login button component.

```tsx
<ZkLoginButton
  provider={OpenIdProvider.Google}
  rpcUrl="https://fullnode.mainnet.sui.io:443"
  onSuccess={(address) => console.log('Connected:', address)}
  onError={(error) => console.error('Error:', error)}
/>
```

#### `ZkLoginDemo`

Demo component showcasing all features.

```tsx
<ZkLoginDemo rpcUrl="https://fullnode.mainnet.sui.io:443" />
```

### Service Class

#### `ZkLoginService`

Low-level service class for direct usage.

```tsx
import { ZkLoginService } from '@/lib/zklogin/service';

const service = new ZkLoginService('https://fullnode.mainnet.sui.io:443');

// Initialize session
const { nonce, loginUrl } = await service.initializeSession();

// Process JWT
const address = service.processJwtToken(jwtToken);

// Get proof
const proof = await service.getZkProof();

// Execute transaction
const result = await service.executeTransaction(transaction);
```

## Supported OAuth Providers

| Provider | Flow Type | Notes |
|----------|-----------|-------|
| Google | Implicit | Most common, recommended |
| Facebook | Implicit | Standard OAuth flow |
| Twitch | Implicit | Gaming platform |
| Apple | Hybrid | Uses form_post response mode |
| Microsoft | Implicit | Azure AD integration |
| Slack | Authorization Code | Requires token exchange |
| Kakao | Authorization Code | Requires token exchange |

## Error Handling

The implementation provides comprehensive error handling:

```tsx
try {
  await zkLogin.initializeLogin(provider);
} catch (error) {
  if (error.message.includes('Missing required environment variables')) {
    // Handle configuration error
  } else if (error.message.includes('Failed to get ZK proof')) {
    // Handle proof generation error
  } else {
    // Handle other errors
  }
}
```

## Session Management

Sessions are automatically persisted in `sessionStorage` and restored on page reload:

```tsx
// Check if session is valid
const isValid = await zkLogin.isSessionValid();

// Manually restore session
const service = new ZkLoginService(rpcUrl);
const restored = service.restoreSession();
```

## Security Considerations

1. **Environment Variables**: Keep OAuth client secrets secure
2. **HTTPS**: Always use HTTPS in production
3. **Redirect URLs**: Validate redirect URLs in OAuth provider settings
4. **Session Storage**: Sessions are stored locally and expire with ephemeral keys
5. **ZK Proofs**: Proofs are generated client-side for privacy

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure `VITE_CLIENT_ID` and `VITE_REDIRECT_URL` are set

2. **"JWT missing required fields"**
   - Check OAuth provider configuration
   - Ensure proper scopes are requested

3. **"Prover service error"**
   - Check network connectivity
   - Verify prover URL is accessible

4. **"zkLogin session not initialized"**
   - Call `initializeLogin()` before other operations

### Debug Mode

Enable debug logging:

```tsx
// Add to your component
useEffect(() => {
  console.debug('zkLogin state:', zkLogin.state);
  console.debug('zkLogin address:', zkLogin.address);
}, [zkLogin.state, zkLogin.address]);
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all linting passes

## License

This implementation follows the same license as the main project.
