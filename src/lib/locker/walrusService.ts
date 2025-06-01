import { WalrusClient } from '@mysten/walrus'
import type { useSuiClient,useWallet } from '@suiet/wallet-kit'

export interface WalrusUploadResponse {
  blobId: string
  size: number
  hash: string
  blobObjectId?: string
}

export interface WalrusDownloadResponse {
  data: Uint8Array
  contentType: string
}

// Wallet adapter types
type WalletType = ReturnType<typeof useWallet>
type SuiClientType = ReturnType<typeof useSuiClient>

/**
 * Upload encrypted content to Walrus blob storage using wallet
 */
export async function uploadToWalrus(
  encryptedData: string,
  wallet: WalletType,
  suiClient: SuiClientType,
  epochs: number = 5,
  deletable: boolean = false
): Promise<WalrusUploadResponse> {

  invariant(suiClient)

  const walrusClient = new WalrusClient({
  network: 'testnet',
  suiClient,
  wasmUrl: 'https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm',
  storageNodeClientOptions: {
    timeout: 60_000,
    onError: (error) => {
      console.warn('Walrus storage node error:', error)
    },
  },
})
  try {
    console.info('Starting Walrus upload...', {
      dataSize: encryptedData.length,
      epochs,
      deletable,
    })

    // Check if wallet is connected
    if (!wallet.connected || !wallet.address) {
      throw new Error('Wallet not connected')
    }

    // Convert hex string to binary data
    const binaryData = new Uint8Array(
      encryptedData.match(/.{1,2}/g)?.map(hex => parseInt(hex, 16)) ?? []
    )

    console.debug('Converted hex data to binary', { binaryLength: binaryData.length })

    // For now, we'll need to use the lower-level approach:
    // 1. Encode the blob first to get metadata
    const { blobId, metadata, rootHash, sliversByNode } = await walrusClient.encodeBlob(binaryData)

    console.debug('Blob encoded', { blobId, rootHashLength: rootHash.length })

    // 2. Create registration transaction with proper metadata
    const registerTx = walrusClient.registerBlobTransaction({
      size: binaryData.length,
      epochs,
      deletable,
      blobId,
      rootHash,
      owner: wallet.address,
    })
    console.log(registerTx)
    registerTx.setSender(wallet.address)
    console.log(registerTx)

    // 3. Execute the registration transaction using wallet
    const registerResult = await wallet.signAndExecuteTransaction({
      transaction: registerTx,
    })

    console.debug('Blob registered on-chain', { digest: registerResult.digest })

    const result = await suiClient.waitForTransaction({
			digest: registerResult.digest,
			options: { showObjectChanges: true, showEffects: true },
		});

    if (result.effects?.status.status !== 'success') {
			throw new Error('Failed to register blob');
		}

    const blobType = await walrusClient.getBlobType();

		const blobObject = result.objectChanges?.find(
			(change) => change.type === 'created' && change.objectType === blobType,
		);

		if (!blobObject || blobObject.type !== 'created') {
			throw new Error('Blob object not found');
		}

    const confirmations = await walrusClient.writeEncodedBlobToNodes({
			blobId,
			metadata,
			sliversByNode,
			deletable: true,
			objectId: blobObject.objectId,
		});

		const certifyBlobTransaction = walrusClient.certifyBlobTransaction({
			blobId,
			blobObjectId: blobObject.objectId,
			confirmations,
			deletable: true,
		});
		certifyBlobTransaction.setSender(wallet.address);

		const { digest: certifyDigest } = await wallet.signAndExecuteTransaction({
			transaction: certifyBlobTransaction,
		});

		const { effects: certifyEffects } = await suiClient.waitForTransaction({
			digest: certifyDigest,
			options: { showEffects: true },
		});

		if (certifyEffects?.status.status !== 'success') {
			throw new Error('Failed to certify blob');
		}

    return {
      blobId,
      size: binaryData.length,
      hash: blobId, // Use blobId as hash since it's derived from content
      blobObjectId: registerResult.digest, // Using transaction digest as reference
    }
  } catch (error) {
    console.error('Failed to upload to Walrus:', error)
    throw new Error(
      error instanceof Error
        ? `Walrus upload failed: ${error.message}`
        : 'Unknown error during Walrus upload'
    )
  }
}

/**
 * Download encrypted content from Walrus blob storage
 */
export async function downloadFromWalrus(blobId: string): Promise<WalrusDownloadResponse> {
  try {
    console.info('Starting Walrus download...', { blobId })

    const blobData = await walrusClient.readBlob({ blobId })

    console.info('Walrus download successful', {
      blobId,
      dataSize: blobData.length
    })

    return {
      data: blobData,
      contentType: 'application/octet-stream',
    }
  } catch (error) {
    console.error('Failed to download from Walrus:', error)
    throw new Error(
      error instanceof Error
        ? `Walrus download failed: ${error.message}`
        : 'Unknown error during Walrus download'
    )
  }
}
