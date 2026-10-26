import { randomBytes } from "node:crypto";

import type { Database } from "@quill/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { handleSchema, normalizeHandle } from "./handle";

// Better Auth generates opaque string ids by default. MongoDB models in the
// Prisma schema are ObjectIds, so ids must be 24 hex characters. The leading
// timestamp keeps ObjectId ordering roughly aligned with creation time.
let seedId = 0;

export function createObjectId() {
  if (process.env.QUILL_SEED === "1") {
    seedId += 1;
    return seedId.toString(16).padStart(24, "0");
  }

  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0");
  return timestamp + randomBytes(8).toString("hex");
}

export type AuthConfig = {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
};

export function createAuth(env: AuthConfig, database: Database) {
  return betterAuth({
    database: prismaAdapter(database, {
      provider: "mongodb",
    }),
    trustedOrigins: [env.BETTER_AUTH_URL],
    advanced: {
      database: {
        generateId: () => createObjectId(),
      },
    },
    emailAndPassword: { enabled: true },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    user: {
      additionalFields: {
        handle: {
          type: "string",
          required: true,
          unique: true,
          input: true,
          validator: { input: handleSchema },
          transform: {
            input: (value) => (typeof value === "string" ? normalizeHandle(value.trim()) : value),
          },
        },
        bio: {
          type: "string",
          required: false,
          defaultValue: "",
          input: false,
        },
        followerCount: {
          type: "number",
          required: false,
          defaultValue: 0,
          input: false,
        },
        followingCount: {
          type: "number",
          required: false,
          defaultValue: 0,
          input: false,
        },
        postCount: {
          type: "number",
          required: false,
          defaultValue: 0,
          input: false,
        },
      },
    },
    plugins: [nextCookies()],
  });
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
