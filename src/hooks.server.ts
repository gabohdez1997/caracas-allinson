import dns from 'node:dns';

// Fixes Node.js (undici fetch) ConnectTimeoutError when connecting to Supabase on certain Windows/ISP setups
// that improperly route IPv6. Forces Node's DNS resolution to prefer IPv4.
dns.setDefaultResultOrder('ipv4first');

// You can add more global server hooks here if needed in the future
