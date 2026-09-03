import { publicInvitation } from "@/lib/invitations";
import { InvitationView } from "./invitation-view";

export default async function InvitationPage({ params }: PageProps<"/invite/[slug]">) {
  const { slug } = await params;
  const invitation = await publicInvitation(slug);
  return <InvitationView invitation={{ ...invitation, eventAt: invitation.eventAt.toISOString() }} />;
}
