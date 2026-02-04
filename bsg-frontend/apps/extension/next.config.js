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

    //no need for this line extension does not user next/image components
    images: {
        unoptimized: true,
    },
}
