const HASHTAG_PATTERN = /(?:^|[^A-Za-z0-9_])#([A-Za-z0-9_]{1,50})/g;
const MENTION_PATTERN = /(?:^|[^A-Za-z0-9_])@([a-zA-Z0-9_]{3,15})/g;

export function parseHashtags(text: string): string[] {
  const tags = new Set<string>();
  for (const match of text.matchAll(HASHTAG_PATTERN)) {
    const tag = match[1];
    if (tag) tags.add(tag.toLowerCase());
  }
  return [...tags];
}

export function parseMentions(text: string): string[] {
  const handles = new Set<string>();
  for (const match of text.matchAll(MENTION_PATTERN)) {
    const handle = match[1];
    if (handle) handles.add(handle.toLowerCase());
  }
  return [...handles];
}

export const POST_TEXT_MAX = 280;
