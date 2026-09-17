import { AdminLayout } from "../../features/auth/components/admin-layout";
import { LeadsInbox } from "../../features/leads/components/leads-inbox";

export default function LeadsPage() {
  return (
    <AdminLayout>
      <LeadsInbox />
    </AdminLayout>
  );
}
