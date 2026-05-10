import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    // Explicitly grant camera access to this origin (required for getUserMedia on some browsers/contexts)
    value: "camera=(self), microphone=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // MediaPipe loads WASM + model files from jsdelivr CDN
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
      "worker-src 'self' blob:",
      "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      // MediaPipe WASM binary + model weights
      "connect-src 'self' https://cdn.jsdelivr.net",
      // Google Fonts (used in layout.tsx)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + data URIs (canvas toDataURL) + blob (IndexedDB rendered photos)
      "img-src 'self' data: blob:",
      // Media: blob for video recording, data for canvas previews
      "media-src 'self' blob: data:",
      // WebGL canvas worker
      "child-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
