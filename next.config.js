// // next.config.js - HTTP Only (Recommended)
// /** @type {import('next').NextConfig} */
// const nextConfig = {
//     reactStrictMode: false,
//     output: 'standalone', // Good for production
//
//     async rewrites() {
//         return [
//             {
//                 source: '/api/:path*',
//                 destination: 'http://192.168.1.145:18000/api/:path*',
//             },
//             {
//                 source: '/backend/:path*',
//                 destination: 'http://192.168.1.145:18000/:path*',
//             },
//         ];
//     },
//
//     webpack: (config, { isServer }) => {
//         if (process.env.NODE_ENV === 'development') {
//             process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
//         }
//         return config;
//     },
// };
//
// module.exports = nextConfig;
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    output: 'standalone',

    // Remove rewrites from Next.js when using Nginx proxy
    // Nginx will handle all backend routing
    async rewrites() {
        // For local development only
        if (process.env.NODE_ENV === 'development') {
            return [
                {
                    source: '/api/:path*',
                    destination: 'http://192.168.1.145:18000/api/:path*',
                },
                {
                    source: '/backend/:path*',
                    destination: 'http://192.168.1.145:18000/:path*',
                },
            ];
        }
        // In production, Nginx handles routing, so no rewrites needed
        return [];
    },

    // Optional: Configure server-side environment variables
    env: {
        NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000/api'
            : '/api',
        NEXT_PUBLIC_BACKEND_URL: process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000/backend'
            : '/backend',
    },

    webpack: (config, { isServer }) => {
        if (process.env.NODE_ENV === 'development') {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }
        return config;
    },
};

module.exports = nextConfig;