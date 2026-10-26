import { createAuth } from "@quill/auth";
import { createPrismaClient } from "@quill/db";

import { ENV } from "./env.server";

export const db = createPrismaClient(ENV);
export const auth = createAuth(ENV, db);
