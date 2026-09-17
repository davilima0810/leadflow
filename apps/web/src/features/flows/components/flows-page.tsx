"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentSession, type CurrentSession } from "../../auth/lib/auth-api";
import { ApiRequestError, UnauthorizedError } from "../../auth/lib/private-api";
import {
  createFlow,
  getFlows,
  publishFlow,
  unpublishFlow,
  updateFlow
} from "../lib/flows-api";
import { buildPublicFlowUrl } from "../lib/public-flow-url";
import type { Flow, FlowFormValues } from "../types/flow";
import { FlowCard } from "./flow-card";
import { FlowForm } from "./flow-form";

type LoadState = "loading" | "success" | "empty" | "error";
type FormMode = "create" | "edit";

type ActiveForm = {
  mode: FormMode;
  flow: Flow | null;
} | null;

export function FlowsPage() {
  const router = useRouter();
  const [session, setSession] = useState<CurrentSession | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [formError, setFormError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [copiedFlowId, setCopiedFlowId] = useState<string | null>(null);
  const [pendingFlowId, setPendingFlowId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoadState("loading");
    setPageMessage("");

    try {
      const [currentSession, loadedFlows] = await Promise.all([
        getCurrentSession(),
        getFlows()
      ]);

      setSession(currentSession);
      setFlows(loadedFlows);
      setLoadState(loadedFlows.length > 0 ? "success" : "empty");
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        router.push("/login");
        return;
      }

      setLoadState("error");
    }
  }

  async function handleSubmit(values: FlowFormValues) {
    if (!activeForm) {
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      if (activeForm.mode === "create") {
        const flow = await createFlow(values);
        setFlows((currentFlows) => [flow, ...currentFlows]);
        setLoadState("success");
      } else if (activeForm.flow) {
        const flow = await updateFlow(activeForm.flow.id, values);
        updateFlowInState(flow);
      }

      setActiveForm(null);
      setPageMessage("Flow salvo com sucesso.");
    } catch (error) {
      setFormError(getFriendlyError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublish(flow: Flow) {
    setPendingFlowId(flow.id);
    setPageMessage("");

    try {
      updateFlowInState(await publishFlow(flow.id));
      setPageMessage("Flow publicado.");
    } catch (error) {
      setPageMessage(getFriendlyError(error));
    } finally {
      setPendingFlowId(null);
    }
  }

  async function handleUnpublish(flow: Flow) {
    const confirmed = window.confirm(
      "Este link deixará de aceitar novos acessos enquanto estiver despublicado."
    );

    if (!confirmed) {
      return;
    }

    setPendingFlowId(flow.id);
    setPageMessage("");

    try {
      updateFlowInState(await unpublishFlow(flow.id));
      setPageMessage("Flow despublicado.");
    } catch (error) {
      setPageMessage(getFriendlyError(error));
    } finally {
      setPendingFlowId(null);
    }
  }

  async function handleCopyLink(flow: Flow) {
    if (!session) {
      return;
    }

    const url = buildPublicFlowUrl(session.company.slug, flow);

    try {
      await navigator.clipboard.writeText(url);
      setCopiedFlowId(flow.id);
      setPageMessage("Link copiado!");
      window.setTimeout(() => setCopiedFlowId(null), 2000);
    } catch {
      setPageMessage(`Não foi possível copiar automaticamente. Link: ${url}`);
    }
  }

  function updateFlowInState(flow: Flow) {
    setFlows((currentFlows) =>
      currentFlows.map((currentFlow) =>
        currentFlow.id === flow.id ? flow : currentFlow
      )
    );
  }

  return (
    <section className="private-page">
      <header className="private-header">
        <div>
          <p className="private-eyebrow">Painel administrativo</p>
          <h1>Meus Flows</h1>
          <p>Crie, publique e compartilhe seus formulários conversacionais.</p>
        </div>
        <button
          className="private-primary-button"
          type="button"
          onClick={() => setActiveForm({ mode: "create", flow: null })}
        >
          + Novo Flow
        </button>
      </header>

      {pageMessage ? <p className="private-feedback">{pageMessage}</p> : null}

      {loadState === "loading" ? <p>Carregando flows...</p> : null}

      {loadState === "error" ? (
        <section className="private-panel">
          <h2>Não foi possível carregar seus Flows.</h2>
          <p>Tente novamente em instantes.</p>
          <button className="private-secondary-button" type="button" onClick={load}>
            Tentar novamente
          </button>
        </section>
      ) : null}

      {loadState === "empty" ? (
        <section className="private-panel empty-state">
          <h2>Você ainda não criou nenhum Flow.</h2>
          <p>Comece criando o primeiro link público para qualificar leads.</p>
          <button
            className="private-primary-button"
            type="button"
            onClick={() => setActiveForm({ mode: "create", flow: null })}
          >
            Criar primeiro Flow
          </button>
        </section>
      ) : null}

      {loadState === "success" && session ? (
        <div className="flow-list">
          {flows.map((flow) => (
            <FlowCard
              companySlug={session.company.slug}
              copiedFlowId={copiedFlowId}
              flow={flow}
              key={flow.id}
              pendingFlowId={pendingFlowId}
              onCopyLink={handleCopyLink}
              onEdit={(selectedFlow) =>
                setActiveForm({ mode: "edit", flow: selectedFlow })
              }
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
            />
          ))}
        </div>
      ) : null}

      {activeForm ? (
        <div
          aria-labelledby="flow-form-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
        >
          <section className="private-panel modal-panel">
            <div className="modal-header">
              <h2 id="flow-form-title">
                {activeForm.mode === "create" ? "Novo Flow" : "Editar Flow"}
              </h2>
              <button
                className="icon-button"
                type="button"
                aria-label="Fechar"
                onClick={() => setActiveForm(null)}
              >
                ×
              </button>
            </div>
            <FlowForm
              error={formError}
              flow={activeForm.flow}
              isSubmitting={isSubmitting}
              onCancel={() => setActiveForm(null)}
              onSubmit={handleSubmit}
            />
          </section>
        </div>
      ) : null}
    </section>
  );
}

function getFriendlyError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 409) {
      return "Você já possui um Flow com esse endereço.";
    }

    if (error.status === 400 && error.message.includes("pelo menos uma pergunta")) {
      return "Adicione pelo menos uma pergunta antes de publicar este Flow.";
    }

    if (error.status === 400) {
      return "Confira os campos e tente novamente.";
    }

    return error.message;
  }

  return "Não foi possível concluir a operação.";
}
