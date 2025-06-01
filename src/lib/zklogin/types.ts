import type { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// zkLogin related types and interfaces
export interface ZkLoginConfig {
  clientId: string;
  proverUrl: string;
  redirectUrl: string;
  openIdProviderUrl: string;
}

export interface JwtPayload {
  iss?: string;
  sub?: string; // Subject ID
  aud?: string[] | string;
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
}

// ZkProof structure based on @mysten/sui zkLogin implementation
export interface ZkProof {
  proofPoints: {
    a: string[];
    b: string[][];
    c: string[];
  };
  issBase64Details: {
    value: string;
    indexMod4: number;
  };
  headerBase64: string;
}

export interface ZkLoginState {
  ephemeralKeyPair: Ed25519Keypair;
  randomness: string;
  nonce: string;
  maxEpoch: number;
  jwtToken?: string;
  decodedJwt?: JwtPayload;
  zkProof?: ZkProof;
  userSalt?: string;
  zkLoginAddress?: string;
}

export interface PartialZkLoginSignature {
  proofPoints: {
    a: string[];
    b: string[][];
    c: string[];
  };
  issBase64Details: {
    value: string;
    indexMod4: number;
  };
  headerBase64: string;
  [key: string]: unknown;
}

export const OpenIdProvider = {
  Google: 'Google',
  Facebook: 'Facebook',
  Twitch: 'Twitch',
  Apple: 'Apple',
  Slack: 'Slack',
  Microsoft: 'Microsoft',
  Kakao: 'Kakao',
} as const;

export type OpenIdProvider = typeof OpenIdProvider[keyof typeof OpenIdProvider];

export interface LoginUrlConfig {
  provider: OpenIdProvider;
  clientId: string;
  redirectUrl: string;
  nonce: string;
  extraParams?: Record<string, string>;
}
