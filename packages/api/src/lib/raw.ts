import type { Prisma } from "@quill/db";

import type { PublicUser } from "./types";

// MongoDB aggregation results come back as extended JSON. These helpers are the
// single place where that untyped boundary is read.

export type RawDoc = Record<string, unknown>;

export function rawString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function rawNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function rawStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function rawObjectId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$oid" in value) {
    const oid = (value as { $oid: unknown }).$oid;
    return typeof oid === "string" ? oid : null;
  }
  return null;
}

export function rawPublicUser(value: unknown, fallbackId?: unknown): PublicUser {
  const doc = value && typeof value === "object" ? (value as RawDoc) : {};
  return {
    id: rawObjectId(doc._id) ?? rawObjectId(fallbackId) ?? "",
    handle: rawString(doc.handle),
    name: rawString(doc.name),
    image: typeof doc.image === "string" ? doc.image : null,
    bio: rawString(doc.bio),
  };
}

export function rawDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  if (value && typeof value === "object" && "$date" in value) {
    const date = (value as { $date: unknown }).$date;
    if (typeof date === "string") return new Date(date);
    if (typeof date === "number") return new Date(date);
  }
  return new Date(0);
}

export function objectIdFilter(id: string): { $oid: string } {
  return { $oid: id };
}

export function dateFilter(value: Date): { $date: string } {
  return { $date: value.toISOString() };
}

export function asRawDocs(value: unknown): RawDoc[] {
  return Array.isArray(value) ? (value as RawDoc[]) : [];
}

// Aggregation stages are plain JSON objects; Prisma's JSON type is narrower
// than the MongoDB operators it accepts, so the cast lives here.
export function asPipeline(stages: Record<string, unknown>[]): Prisma.InputJsonValue[] {
  return stages as unknown as Prisma.InputJsonValue[];
}
