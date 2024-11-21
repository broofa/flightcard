import type { NextConfig } from 'next';
const { GOOGLE_CLIENT_ID } = process.env;

const nextConfig: NextConfig = {
  env: {
    GOOGLE_CLIENT_ID,
  },
  /* config options here */
};

export default nextConfig;
