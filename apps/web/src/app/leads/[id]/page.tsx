import { AdminLayout } from "../../../features/auth/components/admin-layout";
import { LeadDetailView } from "../../../features/leads/components/lead-detail-view";

type LeadDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;

  return (
    <AdminLayout>
      <LeadDetailView leadId={id} />
    </AdminLayout>
  );
}
