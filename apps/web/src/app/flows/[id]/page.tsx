import { AdminLayout } from "../../../features/auth/components/admin-layout";
import { FlowBuilder } from "../../../features/flows/components/flow-builder";

type FlowBuilderPlaceholderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FlowBuilderPlaceholderPage({
  params
}: FlowBuilderPlaceholderPageProps) {
  const { id } = await params;

  return (
    <AdminLayout>
      <FlowBuilder flowId={id} />
    </AdminLayout>
  );
}
