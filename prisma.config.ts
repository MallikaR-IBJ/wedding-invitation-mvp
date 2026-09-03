import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const directUrl = new URL(env("DATABASE_URL"));
directUrl.port = "5432";
directUrl.searchParams.delete("pgbouncer");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: directUrl.toString() },
});
