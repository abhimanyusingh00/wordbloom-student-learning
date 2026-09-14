/**
 * Static export can be served from a sub-path (GitHub Pages), and Next only
 * rewrites its own bundles — plain <img> sources are ours to prefix.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const asset = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${basePath}${path}`;
