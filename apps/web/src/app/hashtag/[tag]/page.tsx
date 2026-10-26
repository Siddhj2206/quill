import { PageShell } from "@/components/page-shell";

export default async function HashtagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return (
    <PageShell title={`#${tag}`}>
      <p className="text-muted-foreground">No posts yet.</p>
    </PageShell>
  );
}
