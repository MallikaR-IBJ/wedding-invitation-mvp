CREATE TYPE "InvitationRole" AS ENUM ('OWNER', 'EDITOR');
CREATE TYPE "MediaKind" AS ENUM ('HERO', 'GROOM', 'BRIDE');

CREATE TABLE "Invitation" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "groomName" TEXT NOT NULL, "brideName" TEXT NOT NULL,
  "eventAt" TIMESTAMP(3) NOT NULL, "venueName" TEXT NOT NULL, "venueAddress" TEXT NOT NULL, "mapUrl" TEXT,
  "message" TEXT NOT NULL, "palette" TEXT NOT NULL DEFAULT 'champagne', "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "ownerId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InvitationMember" (
  "id" TEXT NOT NULL, "invitationId" TEXT NOT NULL, "userId" TEXT NOT NULL, "role" "InvitationRole" NOT NULL DEFAULT 'EDITOR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "InvitationMember_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InvitationMedia" (
  "id" TEXT NOT NULL, "invitationId" TEXT NOT NULL, "kind" "MediaKind" NOT NULL, "storagePath" TEXT NOT NULL,
  "alt" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "InvitationMedia_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ScheduleItem" (
  "id" TEXT NOT NULL, "invitationId" TEXT NOT NULL, "startsAt" TEXT NOT NULL, "title" TEXT NOT NULL,
  "detail" TEXT, "sortOrder" INTEGER NOT NULL, CONSTRAINT "ScheduleItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Invitation_slug_key" ON "Invitation"("slug");
CREATE INDEX "InvitationMember_userId_idx" ON "InvitationMember"("userId");
CREATE UNIQUE INDEX "InvitationMember_invitationId_userId_key" ON "InvitationMember"("invitationId", "userId");
CREATE INDEX "InvitationMedia_invitationId_kind_sortOrder_idx" ON "InvitationMedia"("invitationId", "kind", "sortOrder");
CREATE UNIQUE INDEX "ScheduleItem_invitationId_sortOrder_key" ON "ScheduleItem"("invitationId", "sortOrder");
ALTER TABLE "InvitationMember" ADD CONSTRAINT "InvitationMember_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvitationMedia" ADD CONSTRAINT "InvitationMedia_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleItem" ADD CONSTRAINT "ScheduleItem_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
