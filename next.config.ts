import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: isGitHubPages ? '/wordbloom-student-learning' : '',
  assetPrefix: isGitHubPages ? '/wordbloom-student-learning/' : '',
  // Next rewrites its own bundle URLs but not the <img> sources in our markup,
  // so the photo paths need the same prefix at runtime.
  env: { NEXT_PUBLIC_BASE_PATH: isGitHubPages ? '/wordbloom-student-learning' : '' },
};

export default nextConfig;
