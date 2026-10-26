import { PostDetail } from "./post-detail";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <h1 className="border-b px-4 py-3 text-base font-medium">Post</h1>
      <PostDetail id={id} />
    </div>
  );
}
