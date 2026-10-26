import type { Session } from "@quill/auth";
import type { Database } from "@quill/db";

export type Context = {
  session: Session | null;
  db: Database;
};
