const DEFAULT_RATE = 5000;

// Read from environment variable or fall back to default
const REFRESH_RATE = process.env.NEXT_PUBLIC_WATCHLIST_REFRESH_INTERVAL
  ? parseInt(process.env.NEXT_PUBLIC_WATCHLIST_REFRESH_INTERVAL, 10)
  : DEFAULT_RATE;

export function useRefreshRate() {
  // Return the configured rate.
  // We maintain the same signature "refreshRate" property for compatibility,
  // but remove the "setRefreshRate" since it's now static config.
  return { refreshRate: REFRESH_RATE }; 
}
