import type { NextConfig } from 'next';

// Set up env vars;
const { GOOGLE_CLIENT_ID, FC_API_ORIGIN, MEMBER_API_ENDPOINT } = process.env;
const env = { GOOGLE_CLIENT_ID, FC_API_ORIGIN, MEMBER_API_ENDPOINT };

const nextConfig: NextConfig = {
  env,
  // Disable React strict mode to get rid of annoying double-logs
  reactStrictMode: false,

  async rewrites() {
    return [
      // Proxy requests to the CF worker
      {
        source: '/worker/:path*',
        destination: `${FC_API_ORIGIN}/:path*`,
      },
      {
        source: '/certs/:path*',
        destination: `${MEMBER_API_ENDPOINT}/:path*`,
      },
    ];
  },
};

export default nextConfig;
