// Security Utility: Strict CORS, XSS Sanitization, and SQL Injection Attack Detection

const SQL_INJECTION_PATTERNS = [
  /(--\s+)|(\/\*[\s\S]*?\*\/)/i,
  /((\%3D)|(=))[^\n]*((%27)|(\')|(\-\-)|(\%3B)|(;))\s*(union|select|drop|insert|update|delete)/i,
  /\w*((\%27)|(\'))(\s*)((\%6F)|o|(\%4F))((\%82)|r|(\%52))\s+1\s*=\s*1/i,
  /(union(\s+all)?\s+select|insert\s+into|update\s+\w+\s+set|delete\s+from|drop\s+table|alter\s+table|truncate\s+table)\s+/i,
  /(information_schema|sys\.tables|pg_catalog|sys\.sysobjects)/i
];

const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
  /document\.cookie/gi,
  /eval\s*\(/gi,
  /window\.location/gi
];

export interface SecurityCheckResult {
  isThreat: boolean;
  type?: 'SQL_INJECTION' | 'XSS' | 'INVALID_CORS';
  reason?: string;
}

/**
 * Sanitizes input strings against XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Inspects request URL and query string for SQL Injection or XSS threats
 */
export function inspectSecurityThreats(targetString: string): SecurityCheckResult {
  if (!targetString) return { isThreat: false };

  const decoded = decodeURIComponent(targetString);

  // Check SQL Injection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(decoded)) {
      return {
        isThreat: true,
        type: 'SQL_INJECTION',
        reason: 'SQL Injection Pattern Detected'
      };
    }
  }

  // Check XSS
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(decoded)) {
      return {
        isThreat: true,
        type: 'XSS',
        reason: 'XSS Script Injection Detected'
      };
    }
  }

  return { isThreat: false };
}

/**
 * Formats Strict CORS headers
 */
export function getStrictCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || '*';
  const requestOrigin = origin || '';

  const isAllowed = allowedOrigin === '*' || allowedOrigin === requestOrigin || requestOrigin.includes('localhost');

  return {
    'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-request-id',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  };
}
