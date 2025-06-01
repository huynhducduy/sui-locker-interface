/**
 * Debugging utilities for zkLogin session issues
 */

export function debugSessionStorage(): void {
  if (typeof window === 'undefined') {
    console.debug('🔍 zkLogin Debug: Server-side environment, no sessionStorage');
    return;
  }

  const stored = sessionStorage.getItem('zklogin_state');

  console.group('🔍 zkLogin Session Debug');

  if (!stored) {
    console.debug('❌ No session data found in sessionStorage');
    console.groupEnd();
    return;
  }

  console.debug('✅ Session data found', {
    dataLength: stored.length,
    dataPreview: stor`${stored.substring(0, 100)  }...`);

  try {
    const parsed = JSON.parse(stored);

    console.debug('📊 Session structure:', {
      hasEphemeralKeyPair: !!parsed.ephemeralKeyPair,
      hasSecretKey: !!parsed.ephemeralKeyPair?.secretKey,
      secretKeyType: typeof parsed.ephemeralKeyPair?.secretKey,
      secretKeyLength: parsed.ephemeralKeyPair?.secretKey?.length,
      hasRandomness: !!parsed.randomness,
      hasNonce: !!parsed.nonce,
      hasMaxEpoch: typeof parsed.maxEpoch === 'number',
      hasJwtToken: !!parsed.jwtToken,
      hasAddress: !!parsed.zkLoginAddress,
      hasUserSalt: !!parsed.userSalt,
      hasZkProof: !!parsed.zkProof,
      maxEpoch: parsed.maxEpoch,
    });

    // Check if we have the minimum required fields
    const isValid = !!(
      parsed.ephemeralKeyPair?.secretKey &&
      parsed.randomness &&
      parsed.nonce &&
      typeof parsed.maxEpoch === 'number'
    );

    console.debug(isValid ? '✅ Session data is valid' : '❌ Session data is incomplete');

  } catch (error) {
    console.debug('❌ Failed to parse session data:', error);
  }

  console.groupEnd();
}

export function debugZkLoginState(zkLogin: any): void {
  console.group('🔍 zkLogin Hook State Debug');

  console.debug('📊 Hook state:', {
    isServiceReady: zkLogin.isServiceReady,
    hasState: !!zkLogin.state,
    isConnected: zkLogin.isConnected,
    hasAddress: !!zkLogin.address,
    isLoading: zkLogin.isLoading,
    hasError: !!zkLogin.error,
    error: zkLogin.error,
  });

  if (zkLogin.state) {
    console.debug('📊 Internal state:', {
      hasEphemeralKeyPair: !!zkLogin.state.ephemeralKeyPair,
      hasRandomness: !!zkLogin.state.randomness,
      hasNonce: !!zkLogin.state.nonce,
      hasMaxEpoch: typeof zkLogin.state.maxEpoch === 'number',
      hasJwtToken: !!zkLogin.state.jwtToken,
      hasAddress: !!zkLogin.state.zkLoginAddress,
      isComplete: !!(zkLogin.state.jwtToken && zkLogin.state.zkLoginAddress),
    });
  }

  console.groupEnd();
}

export function debugAuthCallback(): void {
  console.group('🔍 Auth Callback Debug');

  const currentUrl = window.location.href;
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));

  console.debug('📊 URL Analysis:', {
    currentUrl,
    hasSearch: !!window.location.search,
    hasHash: !!window.location.hash,
    searchParams: Object.fromEntries(urlParams.entries()),
    hashParams: Object.fromEntries(hashParams.entries()),
  });

  // Try to extract JWT token
  const idTokenFromHash = hashParams.get('id_token');
  const idTokenFromSearch = urlParams.get('id_token');
  const jwtToken = idTokenFromHash || idTokenFromSearch;

  console.debug('🎟️ JWT Token:', {
    foundInHash: !!idTokenFromHash,
    foundInSearch: !!idTokenFromSearch,
    hasToken: !!jwtToken,
    tokenPreview: jwtToken ? jwtToken.substring`${jwtToken.substring(0, 50)  }...`debugSessionStorage();

  console.groupEnd();
}
