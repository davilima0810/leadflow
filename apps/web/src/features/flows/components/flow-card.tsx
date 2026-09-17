"use client";

import Link from "next/link";
import { buildPublicFlowUrl } from "../lib/public-flow-url";
import type { Flow } from "../types/flow";
import { FlowStatusBadge } from "./flow-status-badge";

type FlowCardProps = {
  companySlug: string;
  copiedFlowId: string | null;
  flow: Flow;
  pendingFlowId: string | null;
  onCopyLink: (flow: Flow) => void;
  onEdit: (flow: Flow) => void;
  onPublish: (flow: Flow) => void;
  onUnpublish: (flow: Flow) => void;
};

export function FlowCard({
  companySlug,
  copiedFlowId,
  flow,
  pendingFlowId,
  onCopyLink,
  onEdit,
  onPublish,
  onUnpublish
}: FlowCardProps) {
  const publicPath = `/c/${companySlug}/${flow.slug}`;
  const isPending = pendingFlowId === flow.id;
  const published = flow.status === "PUBLISHED";

  return (
    <article className="flow-card">
      <div className="flow-card-main">
        <div>
          <div className="flow-card-title">
            <h2>{flow.name}</h2>
            <FlowStatusBadge status={flow.status} />
          </div>
          {flow.description ? <p>{flow.description}</p> : null}
          <code>{publicPath}</code>
        </div>
      </div>

      <div className="flow-card-actions">
        <button className="private-secondary-button" type="button" onClick={() => onEdit(flow)}>
          Editar
        </button>
        <Link className="private-secondary-button" href={`/flows/${flow.id}`}>
          Configurar
        </Link>
        {published ? (
          <>
            <button
              className="private-secondary-button"
              type="button"
              onClick={() => onCopyLink(flow)}
            >
              {copiedFlowId === flow.id ? "Link copiado!" : "Copiar link"}
            </button>
            <a
              className="private-secondary-button"
              href={buildPublicFlowUrl(companySlug, flow)}
              rel="noreferrer"
              target="_blank"
            >
              Abrir
            </a>
            <button
              className="private-danger-button"
              disabled={isPending}
              type="button"
              onClick={() => onUnpublish(flow)}
            >
              {isPending ? "Atualizando..." : "Despublicar"}
            </button>
          </>
        ) : (
          <button
            className="private-primary-button"
            disabled={isPending}
            type="button"
            onClick={() => onPublish(flow)}
          >
            {isPending ? "Publicando..." : "Publicar"}
          </button>
        )}
      </div>
    </article>
  );
}
