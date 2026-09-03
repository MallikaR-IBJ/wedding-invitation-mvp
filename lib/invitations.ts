import "server-only";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

export async function publicInvitation(slug: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { slug, isPublished: true },
    include: { media: { where: { kind: { in: ["HERO", "SP", "GROOM", "BRIDE"] } }, orderBy: { sortOrder: "asc" } }, schedule: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invitation) notFound();
  return invitation;
}

export async function editableInvitation(slug: string) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const invitation = await prisma.invitation.findFirst({
    where: user.isAdmin ? { slug } : { slug, ownerId: user.id },
    include: { media: { orderBy: { sortOrder: "asc" } }, schedule: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invitation) notFound();
  return { invitation, user };
}
