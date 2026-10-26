import { PageContainer, PageHeader } from "@/components/page";
import { PostDetail } from "./post-detail";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PageContainer>
      <PageHeader title="Post" />
      <PostDetail id={id} />
    </PageContainer>
  );
}
