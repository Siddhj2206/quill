import { PageContainer, PageHeader } from "@/components/page";
import { ExploreView } from "./explore-view";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = Array.isArray(params.q) ? (params.q[0] ?? "") : (params.q ?? "");

  return (
    <PageContainer>
      <PageHeader title="Explore" />
      <ExploreView initialQuery={query.trim()} />
    </PageContainer>
  );
}
