/**
 * IP-based location detection
 * Detects user's country from IP address and returns appropriate language
 */

// List of Vietnam IP ranges and providers for more accurate detection
const VIETNAM_IP_PATTERNS = [
  // VNNIC (Vietnam Internet Network Information Center)
  { start: '1.0.0.0', end: '1.255.255.255' },
  { start: '14.0.0.0', end: '14.255.255.255' },
  { start: '27.0.0.0', end: '27.255.255.255' },
  { start: '43.224.0.0', end: '43.255.255.255' },
  { start: '49.156.0.0', end: '49.156.255.255' },
  { start: '58.78.0.0', end: '58.79.255.255' },
  { start: '58.186.0.0', end: '58.186.255.255' },
  { start: '58.187.0.0', end: '58.187.255.255' },
  { start: '61.28.0.0', end: '61.31.255.255' },
  { start: '79.110.0.0', end: '79.110.255.255' },
  { start: '103.1.0.0', end: '103.99.255.255' },
  { start: '115.146.0.0', end: '115.147.255.255' },
  { start: '118.68.0.0', end: '118.70.255.255' },
  { start: '118.107.0.0', end: '118.108.255.255' },
  { start: '175.0.0.0', end: '175.255.255.255' },
  { start: '203.113.0.0', end: '203.113.255.255' },
  { start: '210.211.0.0', end: '210.211.255.255' },
  { start: '210.245.0.0', end: '210.245.255.255' },
  { start: '215.45.0.0', end: '215.45.255.255' },
  { start: '222.252.0.0', end: '222.255.255.255' },
];

/**
 * Convert IP address to number for range comparison
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.');
  if (parts.length !== 4) return 0;
  
  return (
    (parseInt(parts[0], 10) << 24) +
    (parseInt(parts[1], 10) << 16) +
    (parseInt(parts[2], 10) << 8) +
    parseInt(parts[3], 10)
  );
}

/**
 * Check if IP is within Vietnam range
 */
function isVietnamIP(ip: string): boolean {
  const ipNum = ipToNumber(ip);
  
  for (const range of VIETNAM_IP_PATTERNS) {
    const startNum = ipToNumber(range.start);
    const endNum = ipToNumber(range.end);
    
    if (ipNum >= startNum && ipNum <= endNum) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract client IP from headers
 * Considers various proxy headers for accurate detection
 */
export function getClientIP(headers: Headers): string {
  // Try common proxy headers first
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP;
  
  const cfConnectingIP = headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) return cfConnectingIP;
  
  const xClientIP = headers.get('x-client-ip');
  if (xClientIP) return xClientIP;
  
  // Fallback - return undefined to indicate no IP found
  return '';
}

/**
 * Detect language based on client IP
 * Returns 'vi' for Vietnam, 'en' for others
 */
export function detectLanguageFromIP(ip: string): 'vi' | 'en' {
  if (!ip) return 'en';
  
  try {
    return isVietnamIP(ip) ? 'vi' : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Get language code from request headers
 * Useful for server components and API routes
 */
export function getLanguageFromRequest(headers: Headers): 'vi' | 'en' {
  const ip = getClientIP(headers);
  return detectLanguageFromIP(ip);
}

/**
 * Get language from browser headers (Accept-Language)
 * Fallback method when IP detection is unavailable
 */
export function getLanguageFromBrowserHeaders(headers: Headers): 'vi' | 'en' {
  const acceptLanguage = headers.get('accept-language') || '';
  
  if (acceptLanguage.includes('vi')) {
    return 'vi';
  }
  
  return 'en';
}
