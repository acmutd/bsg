/** @type {import('next').NextConfig} */
module.exports = {
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
