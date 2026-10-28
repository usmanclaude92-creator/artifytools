import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    // The "PDFs & Documents" category became "PDF Converter" (and "Edit & Organise PDF").
    return [
      { source: "/categories/pdfs-documents", destination: "/categories/pdf-converter", permanent: true },
      { source: "/ar/categories/pdfs-documents", destination: "/ar/categories/pdf-converter", permanent: true },
      // "Translate PDF" and "Text Translator" became one tool, "Document Translator".
      { source: "/tools/translate-pdf", destination: "/tools/document-translator", permanent: true },
      { source: "/tools/text-translator", destination: "/tools/document-translator", permanent: true },
      { source: "/ar/tools/translate-pdf", destination: "/ar/tools/document-translator", permanent: true },
      { source: "/ar/tools/text-translator", destination: "/ar/tools/document-translator", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
