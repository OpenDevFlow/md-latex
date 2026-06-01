interface Env {
  ALLOWED_ORIGIN: string;
}

interface TokenRequest {
  client_id: string;
  device_code: string;
  grant_type: string;
}

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const allowedOrigin = env.ALLOWED_ORIGIN;

    if (request.method === 'OPTIONS') {
      if (origin === allowedOrigin) {
        return new Response(null, { status: 204, headers: corsHeaders(allowedOrigin) });
      }
      return new Response(null, { status: 403 });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405);
    }

    if (origin !== allowedOrigin) {
      return jsonResponse({ error: 'forbidden' }, 403);
    }

    let body: TokenRequest;
    try {
      body = (await request.json()) as TokenRequest;
    } catch {
      return jsonResponse(
        { error: 'invalid_request', error_description: 'Request body must be valid JSON.' },
        400,
        allowedOrigin,
      );
    }

    const { client_id, device_code, grant_type } = body;
    if (!client_id || !device_code || !grant_type) {
      return jsonResponse(
        { error: 'invalid_request', error_description: 'Missing required fields: client_id, device_code, grant_type.' },
        400,
        allowedOrigin,
      );
    }

    const githubRes = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id, device_code, grant_type }),
    });

    const data = await githubRes.json();

    return jsonResponse(data as Record<string, unknown>, githubRes.status, allowedOrigin);
  },
};

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  allowedOrigin?: string,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(allowedOrigin ? corsHeaders(allowedOrigin) : {}),
    },
  });
}
