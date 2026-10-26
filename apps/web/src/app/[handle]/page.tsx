import { PageContainer } from "@/components/page";
import { ProfileView } from "./profile-view";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return (
    <PageContainer>
      <ProfileView handle={handle.toLowerCase()} />
    </PageContainer>
  );
}
