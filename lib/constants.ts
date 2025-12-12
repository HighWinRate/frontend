/**
 * Constants and environment-based configuration
 */

// Landing URL from environment variable
export const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3003';

// Helper functions for building URLs
export const getLandingUrl = (path: string = '') => {
  const baseUrl = LANDING_URL.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// Common Landing URLs
export const LANDING_URLS = {
  home: getLandingUrl('/'),
  products: getLandingUrl('/products'),
} as const;

