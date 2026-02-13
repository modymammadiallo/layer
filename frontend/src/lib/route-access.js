export const PUBLIC_PATHS = ["/login", "/register", "/offline"];

export function isPublicPath(pathname) {
  if (!pathname) return false;
  return PUBLIC_PATHS.some((path) => pathname === path);
}
