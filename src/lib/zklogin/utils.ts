import { jwtDecode } from 'jwt-decode';

import type { JwtPayload, LoginUrlConfig, OpenIdProvider } from './types';
import { OpenIdProvider as OpenIdProviders } from './types';

/**
 * Generate OAuth login URL for different providers
 */
export function generateLoginUrl(config: LoginUrlConfig): string {
  const { provider, clientId, redirectUrl, nonce, extraParams = {} } = config;

  const baseParams = {
    client_id: clientId,
    redirect_uri: redirectUrl,
    nonce,
    ...extraParams,
  };

  const params = new URLSearchParams(baseParams);

  switch (provider) {
    case OpenIdProviders.Google:
      params.set('response_type', 'id_token');
      params.set('scope', 'openid');
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    case OpenIdProviders.Facebook:
      params.set('response_type', 'id_token');
      params.set('scope', 'openid');
      return `https://www.facebook.com/v17.0/dialog/oauth?${params.toString()}`;

    case OpenIdProviders.Twitch:
      params.set('response_type', 'id_token');
      params.set('scope', 'openid');
      params.set('force_verify', 'true');
      params.set('lang', 'en');
      params.set('login_type', 'login');
      return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;

    case OpenIdProviders.Apple:
      params.set('response_type', 'code id_token');
      params.set('scope', 'email');
      params.set('response_mode', 'form_post');
      return `https://appleid.apple.com/auth/authorize?${params.toString()}`;

    case OpenIdProviders.Microsoft:
      params.set('response_type', 'id_token');
      params.set('scope', 'openid');
      return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

    case OpenIdProviders.Slack:
      params.set('response_type', 'code');
      params.set('scope', 'openid');
      return `https://slack.com/openid/connect/authorize?${params.toString()}`;

    case OpenIdProviders.Kakao:
      params.set('response_type', 'code');
      return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }
}

/**
 * Decode JWT token and validate its structure
 */
export function decodeJwt(token: string): JwtPayload {
  try {
    const decoded = jwtDecode<JwtPayload>(token);

    if (!decoded.sub) {
      throw new Error('JWT missing required "sub" field');
    }

    if (!decoded.aud) {
      throw new Error('JWT missing required "aud" field');
    }

    if (!decoded.iss) {
      throw new Error('JWT missing required "iss" field');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Failed to decode JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract JWT token from URL parameters
 */
export function extractJwtFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Check for id_token in hash (for implicit flow)
    if (urlObj.hash) {
      const hashParams = new URLSearchParams(urlObj.hash.slice(1));
      const idToken = hashParams.get('id_token');
      if (idToken) return idToken;
    }

    // Check for id_token in search params
    const idToken = urlObj.searchParams.get('id_token');
    if (idToken) return idToken;

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract authorization code from URL parameters
 */
export function extractAuthCodeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('code');
  } catch {
    return null;
  }
}

/**
 * Generate a random user salt for zkLogin address computation
 */
export function generateUserSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Determine if a provider requires token exchange (auth code flow)
 */
export function requiresTokenExchange(provider: OpenIdProvider): boolean {
  return provider === OpenIdProviders.Kakao || provider === OpenIdProviders.Slack;
}

/**
 * Debug utility to check session storage health
 */
export function debugSessionHealth(): {
  hasSessionStorage: boolean;
  hasZkLoginState: boolean;
  sessionDataValid: boolean;
  sessionDataSize: number;
  errors: string[];
} {
  const result = {
    hasSessionStorage: false,
    hasZkLoginState: false,
    sessionDataValid: false,
    sessionDataSize: 0,
    errors: [] as string[],
  };

  try {
    // Check if sessionStorage is available
    if (typeof window === 'undefined') {
      result.errors.push('Running in server-side environment');
      return result;
    }

    // window.sessionStorage will always exist if window is defined
    // So, the check `!window.sessionStorage` is redundant here.
    result.hasSessionStorage = true;

    // Check zkLogin state
    const zkLoginState = sessionStorage.getItem('zklogin_state');
    if (!zkLoginState) {
      result.errors.push('No zkLogin state found in sessionStorage');
      return result;
    }

    result.hasZkLoginState = true;
    result.sessionDataSize = zkLoginState.length;

    // Validate session data structure
    try {
      const parsed = JSON.parse(zkLoginState) as {
        ephemeralKeyPair?: { secretKey: number[] };
        randomness?: string;
        nonce?: string;
        maxEpoch?: number;
        [key: string]: unknown;
      };

      const requiredFields = ['ephemeralKeyPair', 'randomness', 'nonce', 'maxEpoch'];
      const missingFields = requiredFields.filter(field => !parsed[field]);

      if (missingFields.length > 0) {
        result.errors.push(`Missing required fields: ${missingFields.join(', ')}`);
        return result;
      }

      if (!parsed.ephemeralKeyPair?.secretKey || !Array.isArray(parsed.ephemeralKeyPair.secretKey)) {
        result.errors.push('Invalid ephemeral keypair structure');
        return result;
      }

      if (typeof parsed.maxEpoch !== 'number') {
        result.errors.push('Invalid maxEpoch value');
        return result;
      }

      result.sessionDataValid = true;
    } catch (parseError) {
      result.errors.push(`Failed to parse session data: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error) {
    result.errors.push(`Session health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Clear all zkLogin related data from storage
 */
export function clearAllZkLoginData(): void {
  if (typeof window === 'undefined') return;

  try {
    // Clear session storage
    sessionStorage.removeItem('zklogin_state');
    sessionStorage.removeItem('zklogin_address');

    // Clear local storage (if any zkLogin data is stored there)
    localStorage.removeItem('zklogin_state');
    localStorage.removeItem('zklogin_address');

    console.info('zkLogin: All storage data cleared');
  } catch (error) {
    console.error('Failed to clear zkLogin data:', error);
  }
}
