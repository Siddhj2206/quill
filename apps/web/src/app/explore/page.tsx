import { ExploreView } from "./explore-view";

export default function ExplorePage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="border-b px-4 py-3 text-base font-medium">Explore</h1>
      <ExploreView />
    </div>
  );
}
