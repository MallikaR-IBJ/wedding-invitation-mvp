CREATE TABLE "Owner" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Owner_userId_key" ON "Owner"("userId");
CREATE UNIQUE INDEX "Owner_email_key" ON "Owner"("email");
