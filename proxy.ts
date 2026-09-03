import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isIpAllowed } from "@/lib/ip-allowlist";

export function proxy(request: NextRequest) {
  if (isIpAllowed(request)) {
    return NextResponse.next();
  }

  return new NextResponse("Access denied.", {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
