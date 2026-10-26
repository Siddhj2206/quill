import { HashtagFeed } from "./hashtag-feed";

export default async function HashtagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const normalized = decodeURIComponent(tag).replace(/^#/, "").toLowerCase();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <h1 className="border-b px-4 py-3 text-base font-medium">#{normalized}</h1>
      <HashtagFeed tag={normalized} />
    </div>
  );
}
