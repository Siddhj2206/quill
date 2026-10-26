import { ProfileView } from "./profile-view";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return (
    <div className="mx-auto w-full max-w-2xl">
      <ProfileView handle={handle.toLowerCase()} />
    </div>
  );
}
