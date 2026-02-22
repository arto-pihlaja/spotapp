import { ApiError } from './apiClient';

/** Returns true for errors caused by network unavailability or server outage (5xx) */
export function isNetworkError(error: unknown): boolean {
  // fetch() throws TypeError on network failure (no connectivity, DNS, CORS)
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    return msg.includes('failed to fetch') || msg.includes('network request failed');
  }

  // Server errors (5xx) are treated as transient — queue for retry
  if (error instanceof ApiError && error.statusCode >= 500) {
    return true;
  }

  return false;
}
