/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  async redirects() {
    return [{ source: "/tasks", destination: "/zadania", permanent: false }];
  },
};

export default nextConfig;
