import { z } from "zod";

export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 15;
export const HANDLE_RULE = "Handle must be 3 to 15 letters, numbers or underscores";

export const handleSchema = z
  .string()
  .trim()
  .min(HANDLE_MIN_LENGTH, HANDLE_RULE)
  .max(HANDLE_MAX_LENGTH, HANDLE_RULE)
  .regex(/^[a-zA-Z0-9_]+$/, HANDLE_RULE);

export function normalizeHandle(value: string): string {
  return value.toLowerCase();
}

export const handleInputSchema = handleSchema.transform(normalizeHandle);
