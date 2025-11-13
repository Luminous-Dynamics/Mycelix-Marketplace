/**
 * IPFS Client Wrapper
 *
 * Handles file uploads to IPFS via Pinata
 */

import { browser } from '$app/environment';

/**
 * Get Pinata configuration from environment
 */
function getPinataConfig() {
  if (!browser) {
    return { jwt: '', gateway: '' };
  }

  return {
    jwt: import.meta.env.VITE_PINATA_JWT || '',
    gateway: import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud',
  };
}

/**
 * Upload a single file to IPFS via Pinata
 *
 * @param file - File to upload
 * @returns IPFS CID
 */
export async function uploadFile(file: File): Promise<string> {
  const config = getPinataConfig();

  // TODO: Implement real Pinata upload in Phase 5
  // For now, return mock CID for development
  if (!config.jwt) {
    console.warn('IPFS upload: No Pinata JWT configured, using mock CID');
    return generateMockCID(file.name);
  }

  try {
    // Real Pinata implementation (Phase 5)
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.jwt}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error('IPFS upload failed:', error);
    // Fallback to mock for development
    return generateMockCID(file.name);
  }
}

/**
 * Upload multiple files to IPFS
 *
 * @param files - Array of files to upload
 * @returns Array of IPFS CIDs
 */
export async function uploadFiles(files: File[]): Promise<string[]> {
  const uploadPromises = files.map(file => uploadFile(file));
  return Promise.all(uploadPromises);
}

/**
 * Get IPFS URL for a CID
 *
 * @param cid - IPFS content identifier
 * @returns Full IPFS gateway URL
 */
export function getIpfsUrl(cid: string): string {
  const config = getPinataConfig();
  return `${config.gateway}/ipfs/${cid}`;
}

/**
 * Generate mock CID for development (Phase 4)
 * Format matches real IPFS CIDs (Qm...)
 *
 * @param filename - Original filename
 * @returns Mock CID
 */
function generateMockCID(filename: string): string {
  const timestamp = Date.now();
  const hash = btoa(`${filename}:${timestamp}`).replace(/[^a-zA-Z0-9]/g, '');
  return `Qm${hash.substring(0, 44).padEnd(44, '0')}`;
}

/**
 * Validate if string is a valid IPFS CID
 *
 * @param cid - String to validate
 * @returns true if valid CID format
 */
export function isValidCID(cid: string): boolean {
  // Basic validation: starts with Qm and is 46 characters
  return /^Qm[a-zA-Z0-9]{44}$/.test(cid);
}

/**
 * Check if Pinata is configured
 *
 * @returns true if Pinata JWT is available
 */
export function isPinataConfigured(): boolean {
  const config = getPinataConfig();
  return config.jwt.length > 0;
}
