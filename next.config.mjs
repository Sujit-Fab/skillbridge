/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/candidates/:candidateId",
        destination: "/candidate/:candidateId",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
