# zkLogin Integration Guide

## Overview

zkLogin has been successfully integrated into the SuiLocker interface, providing users with the ability to authenticate using social OAuth providers (Google, Facebook, Twitch, Apple, Microsoft) through zero-knowledge proofs.

## Integration Components

### 1. Authentication Provider (`src/lib/auth/AuthProvider.tsx`)
- Unified authentication context that handles both traditional wallet and zkLogin
- Provides a single interface for authentication state management
- Automatically detects and prioritizes the active authentication method

### 2. OAuth Callback Route (`src/routes/auth.callback.tsx`)
- Handles OAuth provider redirects after user authentication
- Processes JWT tokens and completes the zkLogin flow
- Provides user feedback during the authentication process

### 3. zkLogin UI Components
- **ZkLoginSection**: Displays multiple OAuth provider options
- **ZkLoginButton**: Individual provider authentication button
- Integrated into the main home page for seamless user experience

### 4. Home Page Integration (`src/views/Home.tsx`)
- Updated to use unified authentication system
- Displays both traditional wallet and zkLogin options
- Shows connection status and method used

## Environment Configuration

Add these environment variables to your `.env.development.local`:

```env
# zkLogin Configuration
VITE_CLIENT_ID=your-oauth-client-id
VITE_PROVER_URL=https://prover.mystenlabs.com/v1
VITE_REDIRECT_URL=http://localhost:5173/auth/callback
VITE_OPENID_PROVIDER_URL=
```

## Usage

### For Users
1. Visit the SuiLocker interface
2. Choose between traditional wallet connection or social login
3. For social login, select your preferred OAuth provider
4. Complete authentication through the provider
5. Get redirected back with your Sui address

### For Developers
```typescript
import { useAuth } from '@/lib/auth/AuthProvider';

function MyComponent() {
  const { isConnected, address, method, zkLogin, disconnect } = useAuth();

  // Check if user is authenticated
  if (isConnected) {
    console.log(`Connected via ${method}: ${address}`);
  }

  // Access zkLogin specific functionality
  if (method === 'zklogin') {
    // Use zkLogin.executeTransaction() for transactions
  }
}
```

## Features

- **Unified Authentication**: Single interface for both wallet and zkLogin
- **Multiple Providers**: Support for Google, Facebook, Twitch, Apple, Microsoft
- **Seamless UX**: Integrated into existing UI with clear provider options
- **Error Handling**: Comprehensive error handling and user feedback
- **Session Management**: Persistent authentication state across page reloads

## Technical Details

- Uses Sui testnet by default (`https://fullnode.testnet.sui.io:443`)
- JWT tokens are processed client-side for privacy
- Zero-knowledge proofs generated using Mysten Labs prover service
- Session state persisted in browser storage using Jotai

## Security Considerations

- JWT tokens are validated before processing
- Zero-knowledge proofs ensure privacy of user identity
- No sensitive user data is stored locally
- OAuth flow follows standard security practices

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure `VITE_CLIENT_ID` is set in your environment

2. **"Authentication failed"**
   - Check that the OAuth provider is properly configured
   - Verify the redirect URL matches your environment

3. **"Invalid authentication token"**
   - The OAuth callback may have failed
   - Try the authentication flow again

### Debug Mode

Enable debug logging by setting `DEBUG=true` in your environment to see detailed zkLogin flow information.
