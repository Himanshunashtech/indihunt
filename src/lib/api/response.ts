import { NextResponse } from 'next/server';

export interface ApiSuccessPayload<T = unknown> {
  success: true;
  data?: T;
  [key: string]: any;
}

export interface ApiFailurePayload {
  success: false;
  error: string;
  details?: unknown;
  [key: string]: any;
}

export type ApiResponsePayload<T = unknown> = ApiSuccessPayload<T> | ApiFailurePayload;

import { encodePayload } from './obfuscate';

/**
 * Universal Response Wrapper for successful API outcomes.
 * If secure: true is enabled or data masking is applied, encodes payload so it's not readable in Network tab.
 */
export function apiSuccess<T = unknown>(
  data?: T,
  status = 200,
  headers?: HeadersInit,
  options?: { secure?: boolean }
): NextResponse {
  if (options?.secure) {
    return apiSuccessSecure(data, status, headers);
  }

  let body: any = { success: true };

  if (data !== undefined && data !== null) {
    if (typeof data === 'object' && !Array.isArray(data)) {
      body = { success: true, ...data };
      if (!('data' in data)) {
        body.data = data;
      }
    } else {
      body.data = data;
    }
  }

  return NextResponse.json(body, { status, headers });
}

/**
 * Secure Response Wrapper that obfuscates / hides the returned payload
 * from plain-text visibility in the browser Network tab.
 */
export function apiSuccessSecure<T = unknown>(
  data?: T,
  status = 200,
  headers?: HeadersInit
): NextResponse {
  const encoded = encodePayload(data !== undefined ? data : null);
  return NextResponse.json(
    {
      success: true,
      _d: encoded
    },
    { status, headers }
  );
}

/**
 * Universal Response Wrapper for failed API outcomes.
 * Guarantees that { success: false, error: string } is returned.
 */
export function apiFailure(error: string, status = 400, details?: unknown, headers?: HeadersInit): NextResponse {
  const body: ApiFailurePayload = {
    success: false,
    error: error || 'An error occurred during request processing',
  };

  if (details !== undefined && details !== null) {
    body.details = details;
  }

  return NextResponse.json(body, { status, headers });
}

/**
 * Universal response wrapper that automatically transforms any data or error into
 * a standardized API response with `success: true` or `success: false`.
 */
export function wrapResponse<T = unknown>(
  payload?: T,
  options?: { status?: number; headers?: HeadersInit; error?: string }
): NextResponse {
  const status = options?.status ?? 200;
  const headers = options?.headers;

  if (payload instanceof NextResponse) {
    return payload;
  }

  if (status >= 400 || options?.error) {
    const errorMsg = options?.error || (typeof payload === 'string' ? payload : (payload as any)?.error || (payload as any)?.message || 'Request failed');
    return apiFailure(errorMsg, status, (payload as any)?.details, headers);
  }

  return apiSuccess(payload, status, headers);
}

/**
 * Higher-Order Route Handler Wrapper:
 * Wraps any Next.js App Router route function, ensuring every response returned
 * automatically passes through the standardized response wrapper with `success: true`,
 * and any unhandled exceptions are caught and returned as `{ success: false, error: ... }`.
 */
export function withResponseWrapper<TArgs extends any[] = any[]>(
  handler: (...args: TArgs) => Promise<any> | any
) {
  return async (...args: TArgs): Promise<NextResponse> => {
    try {
      const result = await handler(...args);
      if (result instanceof NextResponse) {
        return result;
      }
      return apiSuccess(result);
    } catch (err: any) {
      console.error('[API Route Uncaught Error]:', err);
      return apiFailure(err?.message || 'Internal server error', 500);
    }
  };
}

export const withApiWrapper = withResponseWrapper;
