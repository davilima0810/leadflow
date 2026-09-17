"use client";

import { buildPublicFlowUrl } from "../lib/public-flow-url";
import type { Flow } from "../types/flow";
import { FlowStatusBadge } from "./flow-status-badge";

type FlowPublishActionsProps = {
  companySlug: string;
  copied: boolean;
  flow: Flow;
  isPending: boolean;
  onCopyLink: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
};

export function FlowPublishActions({
  companySlug,
  copied,
  flow,
  isPending,
  onCopyLink,
  onPublish,
  onUnpublish
}: FlowPublishActionsProps) {
  const published = flow.status === "PUBLISHED";

  return (
    <div className="builder-actions">
      <FlowStatusBadge status={flow.status} />
      {published ? (
        <>
          <button className="private-secondary-button" type="button" onClick={onCopyLink}>
            {copied ? "Link copiado!" : "Copiar link"}
          </button>
          <a
            className="private-secondary-button"
            href={buildPublicFlowUrl(companySlug, flow)}
            rel="noreferrer"
            target="_blank"
          >
            Abrir formulário
          </a>
          <button
            className="private-danger-button"
            disabled={isPending}
            type="button"
            onClick={onUnpublish}
          >
            {isPending ? "Despublicando..." : "Despublicar"}
          </button>
        </>
      ) : (
        <button
          className="private-primary-button"
          disabled={isPending}
          type="button"
          onClick={onPublish}
        >
          {isPending ? "Publicando..." : "Publicar Flow"}
        </button>
      )}
    </div>
  );
}
