export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
const CORS_PROXY = 'https://corsproxy.io/?';

// First-party Cloudflare Worker that performs the token exchange server-side so
// the access_token never transits public third-party proxy infrastructure.
const OAUTH_PROXY_URL = process.env.NEXT_PUBLIC_GITHUB_OAUTH_PROXY_URL || '';

/**
 * Initiates the Device Authorization Flow.
 * Uses a public CORS proxy — only a device_code and user_code are returned here,
 * no access tokens, so third-party transit risk is low.
 */
export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  if (!CLIENT_ID) {
    throw new Error('GitHub Client ID is not configured.');
  }

  const targetUrl = 'https://github.com/login/device/code';
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
 * Polls for the access token via the first-party OAuth proxy Worker.
 * The Worker forwards the request to GitHub server-side so the access_token
 * is never exposed to public third-party infrastructure.
 */
export async function pollForToken(
  deviceCode: string,
  intervalSeconds: number,
  isCancelled: () => boolean
): Promise<string> {
  if (!OAUTH_PROXY_URL) {
    throw new Error(
      'GitHub OAuth proxy URL is not configured. Set NEXT_PUBLIC_GITHUB_OAUTH_PROXY_URL.'
    );
  }

  let intervalMs = intervalSeconds * 1000;

  while (!isCancelled()) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    if (isCancelled()) break;

    const response = await fetch(OAUTH_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      return data.access_token;
    }

    if (data.error) {
      if (data.error === 'authorization_pending') {
        continue;
      }
      if (data.error === 'slow_down') {
        intervalMs += 5000;
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
