import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required for the Docker standalone build
  output: 'standalone',

  // Monaco Editor uses web workers; allow them
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Prevent duplicate React instances inside Monaco
      'monaco-editor': require.resolve('react-monaco-editor/lib/index.js'),
      // sileo ships both CJS and ESM; pin to CJS to prevent dual-instance issue
      sileo: require.resolve('sileo/dist/index.js')
    }
    return config
  }
}

export default nextConfig
