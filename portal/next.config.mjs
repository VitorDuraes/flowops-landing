/** @type {import('next').NextConfig} */
const nextConfig = {
  // No MVP nao bloqueamos o build por lint. Erros de tipo continuam barrando.
  eslint: { ignoreDuringBuilds: true },
  // A landing (index.html) e servida na raiz "/" a partir de public/landing.html
  // (sincronizada da raiz do repo por scripts/sync-landing.mjs). Assim landing e
  // portal ficam na MESMA origem e os links /checkout e /cliente/login funcionam.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/landing.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
