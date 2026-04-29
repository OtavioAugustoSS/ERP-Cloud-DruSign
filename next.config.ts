import type { NextConfig } from "next";

const securityHeaders = [
    // Impede o site de ser carregado em iframe (clickjacking)
    { key: 'X-Frame-Options', value: 'DENY' },
    // Impede browsers de adivinhar tipos MIME
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // Controla quanto referrer enviar em navegações cross-origin
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // Restringe APIs sensíveis (camera, mic, geolocation)
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    // Força HTTPS por 2 anos (só ativo em produção HTTPS)
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
    poweredByHeader: false, // Esconde header "X-Powered-By: Next.js"
    reactStrictMode: true,

    async headers() {
        return [
            {
                source: '/:path*',
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;
