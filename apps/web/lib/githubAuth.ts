export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
const CORS_PROXY = 'https://corsproxy.io/?';

/**
 * Initiates the Device Authorization Flow
 */
export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  if (!CLIENT_ID) {
    throw new Error('GitHub Client ID is not configured.');
  }

  const targetUrl = 'https://github.com/login/device/code';
  // Use CORS proxy to bypass GitHub's lack of CORS on OAuth endpoints
  const url = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      scope: 'repo',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to request device code from GitHub.');
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return data as DeviceCodeResponse;
}

/**
 * Polls GitHub for the access token until the user authorizes or it expires.
 */
export async function pollForToken(
  deviceCode: string,
  intervalSeconds: number,
  isCancelled: () => boolean
): Promise<string> {
  const intervalMs = intervalSeconds * 1000;

  while (!isCancelled()) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    if (isCancelled()) break;

    // Append a timestamp to completely bypass proxy CDN caching!
    const targetUrl = `https://github.com/login/oauth/access_token?_t=${Date.now()}`;
    const url = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      return data.access_token; // Success!
    }

    if (data.error) {
      if (data.error === 'authorization_pending') {
        // Keep waiting
        continue;
      }
      if (data.error === 'slow_down') {
        // Add extra time to interval if requested by GitHub
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      if (data.error === 'expired_token') {
        throw new Error('The device code expired. Please try again.');
      }
      if (data.error === 'access_denied') {
        throw new Error('Authorization was denied by the user.');
      }
      
      throw new Error(data.error_description || data.error);
    }
  }
  
  throw new Error('Cancelled');
}
