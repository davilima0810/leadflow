import { AdminLayout } from "../../features/auth/components/admin-layout";
import { FlowsPage } from "../../features/flows/components/flows-page";

export default function FlowsRoutePage() {
  return (
    <AdminLayout>
      <FlowsPage />
    </AdminLayout>
  );
}
