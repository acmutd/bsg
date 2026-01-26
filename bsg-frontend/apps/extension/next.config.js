/** @type {import('next').NextConfig} */
module.exports = {
    reactStrictMode: true,
    output: 'standalone',

    transpilePackages: [
        '@bsg/components',
        '@bsg/ui',
        '@bsg/lib',
        '@bsg/models',
        '@bsg/ui-styles',
    ],
}
