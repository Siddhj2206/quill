import type { Database, Prisma } from "@quill/db";

type Tx = Prisma.TransactionClient;

export async function createNotification(
  tx: Tx,
  input: {
    recipientId: string;
    actorId: string;
    type: "LIKE" | "REPOST" | "REPLY" | "FOLLOW" | "MENTION";
    postId?: string | null;
  },
): Promise<void> {
  if (input.recipientId === input.actorId) return;
  await tx.notification.create({
    data: {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      postId: input.postId ?? null,
    },
  });
}

export async function deleteNotification(
  db: Database | Tx,
  input: {
    recipientId: string;
    actorId: string;
    type: "LIKE" | "REPOST" | "REPLY" | "FOLLOW" | "MENTION";
    postId?: string | null;
  },
): Promise<void> {
  await db.notification.deleteMany({
    where: {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      ...(input.postId ? { postId: input.postId } : {}),
    },
  });
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
