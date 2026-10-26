export type PublicUser = {
  id: string;
  handle: string;
  name: string;
  image: string | null;
  bio: string;
};

export type ReplyContext = {
  id: string;
  handle: string;
};

export type PostDto = {
  id: string;
  text: string;
  hashtags: string[];
  mentions: string[];
  createdAt: string;
  replyToId: string | null;
  repostOfId: string | null;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  author: PublicUser;
  replyTo: ReplyContext | null;
  repostOf: PostDto | null;
  likedByMe: boolean;
  repostedByMe: boolean;
};

export type Page<T> = {
  items: T[];
  nextCursor: string | null;
};

export type TrendTag = {
  tag: string;
  count: number;
};

export type SuggestedUser = {
  user: PublicUser;
  mutualCount: number;
};

export type ActiveAccount = {
  user: PublicUser;
  postCount: number;
  totalEngagement: number;
  engagementRate: number;
};

export type HourActivity = {
  hour: number;
  count: number;
};

export type NotificationDto = {
  id: string;
  type: "LIKE" | "REPOST" | "REPLY" | "FOLLOW" | "MENTION";
  createdAt: string;
  readAt: string | null;
  actor: PublicUser;
  post: { id: string; text: string } | null;
};
