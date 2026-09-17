import type { FlowStatus } from "../types/flow";

type FlowStatusBadgeProps = {
  status: FlowStatus;
};

export function FlowStatusBadge({ status }: FlowStatusBadgeProps) {
  const published = status === "PUBLISHED";

  return (
    <span className="flow-status" data-status={status}>
      <span aria-hidden="true" />
      {published ? "Publicado" : "Rascunho"}
    </span>
  );
}
