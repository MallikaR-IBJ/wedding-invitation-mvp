import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const cookieName = "wedding-invitation-session";

type SupabaseUser = { id: string; email?: string };
export type CurrentUser = SupabaseUser & { isAdmin: boolean };

export async function currentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;

  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const user = response.ok ? (await response.json() as SupabaseUser) : null;
  if (!user?.email) return null;
  const admin = await prisma.admin.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (admin) return { ...user, isAdmin: true };
  const owner = await prisma.owner.findUnique({ where: { userId: user.id }, select: { id: true } });
  return owner ? { ...user, isAdmin: false } : null;
}

export async function currentAdmin() {
  const user = await currentUser();
  return user?.isAdmin ? user : null;
}

export async function setSession(accessToken: string, expiresIn: number) {
  (await cookies()).set(cookieName, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: expiresIn,
    path: "/",
  });
}

export async function clearSession() {
  (await cookies()).delete(cookieName);
}
