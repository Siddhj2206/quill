import type { Database, NotificationType, Prisma } from "@quill/db";

type Tx = Prisma.TransactionClient;

type NotificationInput = {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId?: string | null;
};

export async function createNotification(tx: Tx, input: NotificationInput): Promise<void> {
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
  input: NotificationInput,
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
