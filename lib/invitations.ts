import "server-only";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

export const defaultHeroes = ["/img/hero-1_sp.webp", "/img/hero-2.webp", "/img/hero-3.webp"];

export async function publicInvitation(slug: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { slug, isPublished: true },
    include: { media: { where: { kind: "HERO" }, orderBy: { sortOrder: "asc" } }, schedule: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invitation) notFound();
  return invitation;
}

export async function editableInvitation(slug: string) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const invitation = await prisma.invitation.findFirst({
    where: user.isAdmin ? { slug } : { slug, members: { some: { userId: user.id } } },
    include: { media: { orderBy: { sortOrder: "asc" } }, schedule: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invitation) notFound();
  return { invitation, user };
}
