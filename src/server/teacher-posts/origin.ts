import type { NextRequest } from "next/server";
/** Next may normalize its internal URL hostname; compare the browser Origin to the incoming Host. */
export function samePostOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const supplied = new URL(origin);
    return supplied.host === host && supplied.protocol === new URL(request.url).protocol && supplied.pathname === "/" && !supplied.username && !supplied.password;
  } catch { return false; }
}
