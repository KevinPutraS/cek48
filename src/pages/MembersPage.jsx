import MembersPageView from "../features/members/MembersPageView";
import useMembersDirectory from "../features/members/useMembersDirectory";

export default function MembersPage() {
  const directory = useMembersDirectory();
  return <MembersPageView directory={directory} />;
}
