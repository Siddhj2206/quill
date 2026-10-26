import { randomBytes } from "node:crypto";

import type { Database } from "@quill/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { z } from "zod";

// Better Auth generates opaque string ids by default. MongoDB models in the
// Prisma schema are ObjectIds, so ids must be 24 hex characters. The leading
// timestamp keeps ObjectId ordering roughly aligned with creation time.
export function createObjectId() {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0");
  return timestamp + randomBytes(8).toString("hex");
}

export type AuthConfig = {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
};

const handleSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_]{3,15}$/, "Handle must be 3 to 15 letters, numbers or underscores");

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
            input: (value) => (typeof value === "string" ? value.toLowerCase() : value),
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
