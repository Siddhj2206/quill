import { PageShell } from "@/components/page-shell";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PageShell title="Post">
      <p className="text-muted-foreground">Post {id}.</p>
    </PageShell>
  );
}
