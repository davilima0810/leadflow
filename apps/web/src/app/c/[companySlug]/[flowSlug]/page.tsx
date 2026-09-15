import { PublicFlowExperience } from "@/features/public-flow/components/public-flow-experience";

type PublicFlowPageProps = {
  params: Promise<{
    companySlug: string;
    flowSlug: string;
  }>;
};

export default async function PublicFlowPage({ params }: PublicFlowPageProps) {
  const { companySlug, flowSlug } = await params;

  return <PublicFlowExperience companySlug={companySlug} flowSlug={flowSlug} />;
}
