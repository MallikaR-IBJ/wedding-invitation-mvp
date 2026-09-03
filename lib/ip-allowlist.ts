import type { NextRequest } from "next/server";

const LOCAL_DEV_IPS = new Set(["127.0.0.1", "::1"]);

function normalizeIp(ip: string) {
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

export function getAllowedIps() {
  const ips = [process.env.COMPANY_IP_1, process.env.COMPANY_IP_2]
    .filter((ip): ip is string => Boolean(ip?.trim()))
    .map((ip) => normalizeIp(ip.trim()));

  return new Set(ips);
}

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstHop = forwardedFor.split(",")[0]?.trim();
    if (firstHop) return normalizeIp(firstHop);
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return normalizeIp(realIp);

  const cfConnectingIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) return normalizeIp(cfConnectingIp);

  return null;
}

export function isIpAllowed(request: NextRequest) {
  const allowedIps = getAllowedIps();
  if (allowedIps.size === 0) return true;

  const clientIp = getClientIp(request);
  if (!clientIp) return false;

  if (process.env.NODE_ENV === "development" && LOCAL_DEV_IPS.has(clientIp)) {
    return true;
  }

  return allowedIps.has(clientIp);
}
