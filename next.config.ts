import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

// Content-Security-Policy
// Em desenvolvimento, o Next usa eval e WebSocket de HMR — precisamos liberar.
// Em produção, restringimos ao máximo (sem eval, sem WS arbitrário).
const cspDirectives = [
    "default-src 'self'",
    // Scripts: Next inlina chunks com hashes/nonces; em dev usa eval para HMR
    `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
    // Styles: Tailwind injeta inline e Next gera <style> inline
    "style-src 'self' 'unsafe-inline'",
    // Imagens: self + data: (avatares com gradiente) + blob: (uploads/preview) + https (CDNs)
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // Conexões: self + ViaCEP (auto-fill de endereço). Em dev, libera WS para HMR.
    `connect-src 'self' https://viacep.com.br${isProd ? '' : ' ws: wss:'}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
];

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
    // Content Security Policy — barreira principal contra XSS
    { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
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
