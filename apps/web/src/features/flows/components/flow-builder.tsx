"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCurrentSession, type CurrentSession } from "../../auth/lib/auth-api";
import { ApiRequestError, UnauthorizedError } from "../../auth/lib/private-api";
import {
  createQuestion,
  deleteQuestion,
  getFlow,
  publishFlow,
  removeFlowBackground,
  removeFlowLogo,
  reorderQuestions,
  unpublishFlow,
  updateFlowAppearance,
  updateQuestion,
  uploadFlowBackground,
  uploadFlowLogo
} from "../lib/flows-api";
import { buildPublicFlowUrl } from "../lib/public-flow-url";
import type {
  Flow,
  FlowAppearanceFormValues,
  Question,
  QuestionFormValues
} from "../types/flow";
import { FlowAppearanceForm } from "./flow-appearance-form";
import { FlowPublishActions } from "./flow-publish-actions";
import { QuestionForm } from "./question-form";
import { QuestionList } from "./question-list";

type FlowBuilderProps = {
  flowId: string;
};

type LoadState = "loading" | "success" | "not-found" | "error";
type ActiveQuestionForm = {
  mode: "create" | "edit";
  question: Question | null;
} | null;

export function FlowBuilder({ flowId }: FlowBuilderProps) {
  const router = useRouter();
  const [session, setSession] = useState<CurrentSession | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [activeQuestionForm, setActiveQuestionForm] =
    useState<ActiveQuestionForm>(null);
  const [formError, setFormError] = useState("");
  const [appearanceError, setAppearanceError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);

  const questions = useMemo(
    () => [...(flow?.questions ?? [])].sort((a, b) => a.position - b.position),
    [flow]
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

  async function load() {
    setLoadState("loading");
    setPageMessage("");

    try {
      const [currentSession, loadedFlow] = await Promise.all([
        getCurrentSession(),
        getFlow(flowId)
      ]);

      setSession(currentSession);
      setFlow(loadedFlow);
      setLoadState("success");
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        router.push("/login");
        return;
      }

      if (error instanceof ApiRequestError && error.status === 404) {
        setLoadState("not-found");
        return;
      }

      setLoadState("error");
    }
  }

  async function handleQuestionSubmit(values: QuestionFormValues) {
    if (!flow || !activeQuestionForm) {
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const question =
        activeQuestionForm.mode === "create"
          ? await createQuestion(flow.id, values, questions.length + 1)
          : await updateQuestion(
              flow.id,
              activeQuestionForm.question?.id ?? "",
              values,
              activeQuestionForm.question?.position ?? questions.length
            );

      setFlow((currentFlow) => {
        if (!currentFlow) {
          return currentFlow;
        }

        const nextQuestions =
          activeQuestionForm.mode === "create"
            ? [...(currentFlow.questions ?? []), question]
            : (currentFlow.questions ?? []).map((currentQuestion) =>
                currentQuestion.id === question.id ? question : currentQuestion
              );

        return {
          ...currentFlow,
          questions: nextQuestions
        };
      });
      setActiveQuestionForm(null);
      setPageMessage("Pergunta salva.");
    } catch (error) {
      setFormError(getFriendlyQuestionError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAppearanceSubmit(values: FlowAppearanceFormValues) {
    if (!flow) {
      return;
    }

    setIsSavingAppearance(true);
    setAppearanceError("");
    setPageMessage("");

    try {
      setFlow(await updateFlowAppearance(flow.id, values));
      setPageMessage("Aparência salva.");
    } catch (error) {
      setAppearanceError(getFriendlyAppearanceError(error));
    } finally {
      setIsSavingAppearance(false);
    }
  }

  async function handleLogoUpload(file: File) {
    if (!flow) {
      return;
    }

    setIsUploadingLogo(true);
    setAppearanceError("");
    setPageMessage("");

    try {
      setFlow(await uploadFlowLogo(flow.id, file));
      setPageMessage("Logo atualizado.");
    } catch (error) {
      setAppearanceError(getFriendlyUploadError(error));
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleBackgroundUpload(file: File) {
    if (!flow) {
      return;
    }

    setIsUploadingBackground(true);
    setAppearanceError("");
    setPageMessage("");

    try {
      setFlow(await uploadFlowBackground(flow.id, file));
      setPageMessage("Imagem de fundo atualizada.");
    } catch (error) {
      setAppearanceError(getFriendlyUploadError(error));
    } finally {
      setIsUploadingBackground(false);
    }
  }

  async function handleLogoRemove() {
    if (!flow) {
      return;
    }

    setIsUploadingLogo(true);
    setAppearanceError("");

    try {
      setFlow(await removeFlowLogo(flow.id));
      setPageMessage("Logo removido.");
    } catch (error) {
      setAppearanceError(getFriendlyUploadError(error));
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleBackgroundRemove() {
    if (!flow) {
      return;
    }

    setIsUploadingBackground(true);
    setAppearanceError("");

    try {
      setFlow(await removeFlowBackground(flow.id));
      setPageMessage("Imagem de fundo removida.");
    } catch (error) {
      setAppearanceError(getFriendlyUploadError(error));
    } finally {
      setIsUploadingBackground(false);
    }
  }

  async function handleDeleteQuestion(question: Question) {
    if (!flow || !window.confirm("Excluir esta pergunta?")) {
      return;
    }

    setPendingQuestionId(question.id);
    setPageMessage("");

    try {
      await deleteQuestion(flow.id, question.id);
      setFlow({
        ...flow,
        questions: questions
          .filter((currentQuestion) => currentQuestion.id !== question.id)
          .map((currentQuestion, index) => ({
            ...currentQuestion,
            position: index + 1
          }))
      });
      setPageMessage("Pergunta excluída.");
    } catch (error) {
      setPageMessage(getFriendlyQuestionError(error));
    } finally {
      setPendingQuestionId(null);
    }
  }

  async function moveQuestion(question: Question, direction: "up" | "down") {
    if (!flow) {
      return;
    }

    const currentIndex = questions.findIndex(
      (currentQuestion) => currentQuestion.id === question.id
    );
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (nextIndex < 0 || nextIndex >= questions.length) {
      return;
    }

    const previousQuestions = questions;
    const nextQuestions = [...questions];
    const [removedQuestion] = nextQuestions.splice(currentIndex, 1);
    nextQuestions.splice(nextIndex, 0, removedQuestion);
    const orderedQuestions = nextQuestions.map((currentQuestion, index) => ({
      ...currentQuestion,
      position: index + 1
    }));

    setFlow({ ...flow, questions: orderedQuestions });
    setPendingQuestionId(question.id);
    setPageMessage("");

    try {
      const reorderedQuestions = await reorderQuestions(
        flow.id,
        orderedQuestions.map((currentQuestion) => currentQuestion.id)
      );
      setFlow({ ...flow, questions: reorderedQuestions });
      setPageMessage("Ordem atualizada.");
    } catch {
      setFlow({ ...flow, questions: previousQuestions });
      setPageMessage("Não foi possível reordenar. Tente novamente.");
    } finally {
      setPendingQuestionId(null);
    }
  }

  async function handlePublish() {
    if (!flow) {
      return;
    }

    setIsPublishing(true);
    setPageMessage("");

    try {
      setFlow(await publishFlow(flow.id));
      setPageMessage("Flow publicado.");
    } catch (error) {
      setPageMessage(getFriendlyQuestionError(error));
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (
      !flow ||
      !window.confirm(
        "Enquanto estiver despublicado, o link público não aceitará novos acessos."
      )
    ) {
      return;
    }

    setIsPublishing(true);
    setPageMessage("");

    try {
      setFlow(await unpublishFlow(flow.id));
      setPageMessage("Flow despublicado.");
    } catch (error) {
      setPageMessage(getFriendlyQuestionError(error));
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleCopyLink() {
    if (!flow || !session) {
      return;
    }

    const url = buildPublicFlowUrl(session.company.slug, flow);

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setPageMessage("Link copiado!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setPageMessage(`Não foi possível copiar automaticamente. Link: ${url}`);
    }
  }

  if (loadState === "loading") {
    return (
      <section className="private-page">
        <p>Carregando Flow...</p>
      </section>
    );
  }

  if (loadState === "not-found") {
    return (
      <section className="private-page">
        <section className="private-panel">
          <h1>Flow não encontrado.</h1>
          <p>Confira se o link está correto ou volte para Meus Flows.</p>
          <Link className="private-secondary-button" href="/flows">
            Voltar
          </Link>
        </section>
      </section>
    );
  }

  if (loadState === "error" || !flow || !session) {
    return (
      <section className="private-page">
        <section className="private-panel">
          <h1>Não foi possível carregar este Flow.</h1>
          <p>Tente novamente em instantes.</p>
          <button className="private-secondary-button" type="button" onClick={load}>
            Tentar novamente
          </button>
        </section>
      </section>
    );
  }

  return (
    <section className="private-page flow-builder-page">
      <header className="builder-header">
        <Link className="private-secondary-button" href="/flows">
          ← Meus Flows
        </Link>
        <div>
          <p className="private-eyebrow">Flow Builder</p>
          <h1>{flow.name}</h1>
          {flow.description ? <p>{flow.description}</p> : null}
          <code>/c/{session.company.slug}/{flow.slug}</code>
        </div>
        <FlowPublishActions
          companySlug={session.company.slug}
          copied={copied}
          flow={flow}
          isPending={isPublishing}
          onCopyLink={handleCopyLink}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
        />
      </header>

      {pageMessage ? <p className="private-feedback">{pageMessage}</p> : null}

      <FlowAppearanceForm
        error={appearanceError}
        flow={flow}
        isUploadingBackground={isUploadingBackground}
        isUploadingLogo={isUploadingLogo}
        isSubmitting={isSavingAppearance}
        onBackgroundRemove={handleBackgroundRemove}
        onBackgroundUpload={handleBackgroundUpload}
        onLogoRemove={handleLogoRemove}
        onLogoUpload={handleLogoUpload}
        onSubmit={handleAppearanceSubmit}
      />

      <section className="builder-section">
        <div className="section-heading">
          <div>
            <h2>Perguntas</h2>
            <p>Configure a sequência que seus clientes responderão.</p>
          </div>
          <button
            className="private-primary-button"
            type="button"
            onClick={() => setActiveQuestionForm({ mode: "create", question: null })}
          >
            + Adicionar pergunta
          </button>
        </div>

        <QuestionList
          pendingQuestionId={pendingQuestionId}
          questions={questions}
          onDelete={handleDeleteQuestion}
          onEdit={(question) => setActiveQuestionForm({ mode: "edit", question })}
          onMoveDown={(question) => moveQuestion(question, "down")}
          onMoveUp={(question) => moveQuestion(question, "up")}
        />
      </section>

      {activeQuestionForm ? (
        <div
          aria-labelledby="question-form-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
        >
          <section className="private-panel modal-panel">
            <div className="modal-header">
              <h2 id="question-form-title">
                {activeQuestionForm.mode === "create"
                  ? "Adicionar pergunta"
                  : "Editar pergunta"}
              </h2>
              <button
                aria-label="Fechar"
                className="icon-button"
                type="button"
                onClick={() => setActiveQuestionForm(null)}
              >
                ×
              </button>
            </div>
            <QuestionForm
              error={formError}
              isSubmitting={isSubmitting}
              question={activeQuestionForm.question}
              onCancel={() => setActiveQuestionForm(null)}
              onSubmit={handleQuestionSubmit}
            />
          </section>
        </div>
      ) : null}
    </section>
  );
}

function getFriendlyAppearanceError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 400) {
      return "Confira as cores em HEX, a URL da imagem e o tamanho da mensagem.";
    }

    return error.message;
  }

  return "Não foi possível salvar a aparência.";
}

function getFriendlyUploadError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 400 || error.status === 413) {
      return "Envie uma imagem JPEG, PNG ou WebP com até 2 MB.";
    }

    return error.message;
  }

  return "Não foi possível atualizar a imagem.";
}

function getFriendlyQuestionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 409) {
      return "Este Flow já possui uma pergunta definida com essa identificação do contato.";
    }

    if (error.status === 400 && error.message.includes("semanticType")) {
      return "A identificação escolhida não combina com o tipo da pergunta.";
    }

    if (error.status === 400 && error.message.includes("pelo menos uma pergunta")) {
      return "Adicione pelo menos uma pergunta antes de publicar.";
    }

    if (error.status >= 500) {
      return "Esta pergunta possui respostas e não pode ser excluída.";
    }

    return error.message;
  }

  return "Não foi possível concluir a operação.";
}
