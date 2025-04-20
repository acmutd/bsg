/** @type {import('next').NextConfig} */
module.exports = {
    reactStrictMode: true,
    output: 'export',

    experimental: {
        transpilePackages: [
            '@bsg/components',
            '@bsg/ui',
            '@bsg/lib',
            '@bsg/models',
            '@bsg/ui-styles',
        ],
    },
}
