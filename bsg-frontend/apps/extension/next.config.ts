import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    reactStrictMode: true,
    output: 'export',

    transpilePackages: [
        '@bsg/components',
        '@bsg/ui',
        '@bsg/lib',
        '@bsg/models',
        '@bsg/ui-styles',
    ],

}

export default nextConfig;
