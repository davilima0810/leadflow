import Link from "next/link";
import { AdminLayout } from "../../../features/auth/components/admin-layout";

type FlowBuilderPlaceholderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FlowBuilderPlaceholderPage({
  params
}: FlowBuilderPlaceholderPageProps) {
  await params;

  return (
    <AdminLayout>
      <section className="private-page">
        <header className="private-header">
          <div>
            <p className="private-eyebrow">Flow Builder</p>
            <h1>Configurar perguntas</h1>
            <p>A configuração das perguntas será implementada nesta área.</p>
          </div>
          <Link className="private-secondary-button" href="/flows">
            Voltar
          </Link>
        </header>

        <section className="private-panel empty-state">
          <h2>Builder em preparação</h2>
          <p>
            O próximo passo do painel será criar, editar e ordenar as perguntas
            deste Flow.
          </p>
        </section>
      </section>
    </AdminLayout>
  );
}
