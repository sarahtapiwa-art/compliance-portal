// next.config.mjs - ES Module version
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nextConfig = {
    reactStrictMode: false,

    // HTTPS Server - listen on all interfaces
    server: {
        https: {
            key: fs.readFileSync(path.join(__dirname, 'certs/server.key')),
            cert: fs.readFileSync(path.join(__dirname, 'certs/server.crt')),
        },
        port: 3000,
        hostname: '0.0.0.0',  // Important: allow external connections
    },

    // Proxy to Spring Boot using your IP
    // async rewrites() {
    //     return [
    //         {
    //             source: '/api/:path*',
    //             // Use IP address instead of localhost for external access
    //             destination: 'https://192.168.1.145:8443/api/:path*',
    //         },
    //         {
    //             source: '/backend/:path*',
    //             destination: 'https://192.168.1.145:8443/:path*',
    //         },
    //     ];
    // },

    // Allow self-signed certificates
    webpack: (config, { isServer }) => {
        // For development with self-signed certs
        if (process.env.NODE_ENV === 'development') {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }
        return config;
    },
}

module.exports = nextConfig