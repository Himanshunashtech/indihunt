import { NextResponse } from 'next/server';
import { logger } from './logger';
import {
  apiSuccess as baseApiSuccess,
  apiFailure as baseApiFailure,
  wrapResponse as baseWrapResponse,
  withResponseWrapper as baseWithResponseWrapper,
  ApiSuccessPayload,
  ApiFailurePayload,
  ApiResponsePayload,
} from './api/response';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | null;
  timestamp?: string;
  requestId?: string;
  [key: string]: any;
}

export {
  baseApiSuccess as apiSuccess,
  baseApiFailure as apiFailure,
  baseApiFailure as apiError,
  baseWrapResponse as wrapResponse,
  baseWithResponseWrapper as withResponseWrapper,
  baseWithResponseWrapper as withApiWrapper,
};

export type { ApiSuccessPayload, ApiFailurePayload, ApiResponsePayload };

export function withApiHandler(
  handler: (request: Request, params?: any) => Promise<NextResponse | any>
) {
  return async (request: Request, params?: any) => {
    const startTime = Date.now();
    const url = new URL(request.url);
    const requestId = request.headers.get('x-request-id') || `req_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const rawResult = await handler(request, params);
      const response = rawResult instanceof NextResponse ? rawResult : baseApiSuccess(rawResult);
      const durationMs = Date.now() - startTime;

      logger.info(`HTTP ${request.method} ${url.pathname}`, {
        requestId,
        path: url.pathname,
        method: request.method,
        statusCode: response.status,
        durationMs,
      });

      response.headers.set('x-request-id', requestId);
      return response;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      logger.error(`Unhandled Exception on ${request.method} ${url.pathname}`, {
        requestId,
        path: url.pathname,
        method: request.method,
        statusCode: 500,
        durationMs,
        details: err.stack || err.message,
      });

      return baseApiFailure(err.message || 'Internal Server Error', 500);
    }
  };
}
