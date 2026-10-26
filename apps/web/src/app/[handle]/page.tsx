import { PageShell } from "@/components/page-shell";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return (
    <PageShell title={`@${handle}`}>
      <p className="text-muted-foreground">No posts yet.</p>
    </PageShell>
  );
}
