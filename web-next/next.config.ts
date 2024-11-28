import type { NextConfig } from 'next';

// Set up env vars;
const { GOOGLE_CLIENT_ID, FC_API_ORIGIN } = process.env;
const env = { GOOGLE_CLIENT_ID, FC_API_ORIGIN };

const nextConfig: NextConfig = {
  env,

  async rewrites() {
    return [
      // Proxy requests to the CF worker
      {
        source: '/worker/:path*',
        destination: `${FC_API_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
