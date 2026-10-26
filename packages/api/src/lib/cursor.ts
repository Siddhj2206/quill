// Cursors carry both createdAt and id so posts created in the same millisecond
// do not repeat or vanish between pages.

export type TimelineCursor = {
  createdAt: Date;
  id: string;
};

export function encodeCursor(cursor: TimelineCursor): string {
  return `${cursor.createdAt.toISOString()}_${cursor.id}`;
}

export function decodeCursor(cursor: string): TimelineCursor | null {
  const separator = cursor.lastIndexOf("_");
  if (separator < 0) return null;
  const date = new Date(cursor.slice(0, separator));
  const id = cursor.slice(separator + 1);
  if (Number.isNaN(date.getTime()) || id.length === 0) return null;
  return { createdAt: date, id };
}
