/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: [],

    experimental: {
        serverComponentsExternalPackages: [
            '@paddle/paddle-js'
        ],
    },

    // 🚀 ÇÖZÜM: Cross-Origin-Opener-Policy Başlığını Gevşetme
    async headers() {
        return [
            {
                // Tüm yollara uygula
                source: '/:path*',
                headers: [
                    {
                        // Bu ayar, Google Sign-In pop-up'larının ana pencereyle güvenli bir şekilde iletişim kurmasını sağlar.
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin-allow-popups', 
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;