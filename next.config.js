// next.config.js - HTTP Only (Recommended)
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    output: 'standalone', // Good for production

    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://192.168.1.145:18000/api/:path*',
            },
            {
                source: '/backend/:path*',
                destination: 'https://192.168.1.145:18000/:path*',
            },
        ];
    },

    webpack: (config, { isServer }) => {
        if (process.env.NODE_ENV === 'development') {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }
        return config;
    },
};

module.exports = nextConfig;