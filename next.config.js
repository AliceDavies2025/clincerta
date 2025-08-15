/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable tracing to prevent the EPERM errors
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-win32-x64-msvc',
        'node_modules/next/dist/compiled/@napi-rs',
        'node_modules/sharp',
        'node_modules/pdf2pic',
        'node_modules/canvas',
        'node_modules/pdfjs-dist',
      ],
    },
  },
  // Configure build output handling
  distDir: '.next',
  poweredByHeader: false,
  // Optimize performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Add better error handling
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  webpack: (config, { isServer }) => {
    // Fix for "Module not found: Can't resolve 'supports-color'"
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        'supports-color': false,
        child_process: false
      };
    }
    
    return config;
  },
  // Enable file serving for PDF, DOC, DOCX files (needed for document processing)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  }
};

module.exports = nextConfig;
