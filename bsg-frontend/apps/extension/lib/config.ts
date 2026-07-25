// NEXT_PUBLIC_ prefix is required — unprefixed vars are never inlined into
// client bundles and resolve to undefined in the browser
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://api.binarysearchgang.com';
export const RTC_SERVICE_URL = process.env.NEXT_PUBLIC_RTC_SERVICE_URL || 'ws://localhost:5001/ws';
