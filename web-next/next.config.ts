import type { NextConfig } from 'next';

// Set up env vars;
const { GOOGLE_CLIENT_ID, APP_WORKER_ORIGIN } = process.env;
const env = { GOOGLE_CLIENT_ID, APP_WORKER_ORIGIN };

const nextConfig: NextConfig = {
  env,

  async rewrites() {
    return [
      // Proxy requests to the CF worker
      {
        source: '/worker/:path*',
        destination: `${APP_WORKER_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
