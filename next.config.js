/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yfg7y7pev1.ufs.sh',  // Add your problematic domain here
        port: '',
        pathname: '/f/**',              // Match your URL pattern more precisely
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/webhooks/clerk',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, svix-id, svix-signature, svix-timestamp' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
