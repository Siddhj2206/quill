import { PageContainer, PageHeader } from "@/components/page";
import { HashtagFeed } from "./hashtag-feed";

export default async function HashtagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const normalized = decodeURIComponent(tag).replace(/^#/, "").toLowerCase();
  return (
    <PageContainer>
      <PageHeader title={`#${normalized}`} description="Posts with this hashtag." />
      <HashtagFeed tag={normalized} />
    </PageContainer>
  );
}
