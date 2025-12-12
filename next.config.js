/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: [],

    experimental: {
        serverComponentsExternalPackages: [
            '@paddle/paddle-js' // lucide-react KALDIRILDI
        ],
    },
};

module.exports = nextConfig;
