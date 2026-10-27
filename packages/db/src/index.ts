import { PrismaClient } from "@prisma/client";
import type { DatabaseConfig } from "./config";

export function createPrismaClient(env: DatabaseConfig) {
  return new PrismaClient({ datasourceUrl: env.DATABASE_URL });
}

export type Database = ReturnType<typeof createPrismaClient>;

export type {
  Prisma,
  Post,
  User,
  Follow,
  Like,
  Notification,
  NotificationType,
} from "@prisma/client";
