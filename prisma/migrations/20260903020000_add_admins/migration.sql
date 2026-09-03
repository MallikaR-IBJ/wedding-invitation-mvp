CREATE TABLE "Admin" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

INSERT INTO "Admin" ("id", "userId", "email") VALUES
  ('cmj2lq1vz0000df7eykhv7bqz', '59dd22a9-aa8f-402f-95b7-a54263200594', 'admin@yoriai.dev');
