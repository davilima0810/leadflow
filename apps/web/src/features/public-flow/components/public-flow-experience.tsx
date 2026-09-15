"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getPublicFlow,
  PublicFlowNotFoundError
} from "../lib/get-public-flow";
import type {
  PublicFlow,
  PublicFlowAnswer,
  PublicFlowQuestion
} from "../types/public-flow";
import { QuestionRenderer } from "./question-renderer";

type PublicFlowExperienceProps = {
  companySlug: string;
  flowSlug: string;
};

type ScreenState = "intro" | "questions" | "done";
type LoadState = "loading" | "ready" | "not-found" | "error";

export function PublicFlowExperience({
  companySlug,
  flowSlug
}: PublicFlowExperienceProps) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [flow, setFlow] = useState<PublicFlow | null>(null);
  const [screen, setScreen] = useState<ScreenState>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, PublicFlowAnswer>>({});
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadFlow() {
      try {
        const loadedFlow = await getPublicFlow(companySlug, flowSlug);

        if (!active) {
          return;
        }

        setFlow(loadedFlow);
        setLoadState("ready");
      } catch (error) {
        if (!active) {
          return;
        }

        setLoadState(error instanceof PublicFlowNotFoundError ? "not-found" : "error");
      }
    }

    void loadFlow();

    return () => {
      active = false;
    };
  }, [companySlug, flowSlug]);

  const questions = useMemo(() => flow?.flow.questions ?? [], [flow]);
  const currentQuestion = questions[currentIndex];
  const progress =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  function updateAnswer(questionId: string, value: PublicFlowAnswer) {
    setValidationMessage("");
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: value
    }));
  }

  function hasAnswer(question: PublicFlowQuestion) {
    const value = answers[question.id];

    if (!question.required) {
      return true;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "boolean") {
      return true;
    }

    if (typeof value === "number") {
      return Number.isFinite(value);
    }

    return typeof value === "string" && value.trim().length > 0;
  }

  function goNext() {
    if (!currentQuestion) {
      setScreen("done");
      return;
    }

    if (!hasAnswer(currentQuestion)) {
      setValidationMessage("Responda esta pergunta para continuar.");
      return;
    }

    setValidationMessage("");

    if (currentIndex >= questions.length - 1) {
      setScreen("done");
      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  function skipQuestion() {
    setValidationMessage("");

    if (currentIndex >= questions.length - 1) {
      setScreen("done");
      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  function goBack() {
    setValidationMessage("");

    if (screen === "done") {
      setScreen("questions");
      setCurrentIndex(Math.max(questions.length - 1, 0));
      return;
    }

    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  if (loadState === "loading") {
    return (
      <main className="public-flow-shell">
        <section className="public-flow-panel">
          <p className="public-flow-eyebrow">LeadFlow</p>
          <h1>Carregando formulário</h1>
          <p>Estamos preparando a experiência.</p>
        </section>
      </main>
    );
  }

  if (loadState === "not-found") {
    return (
      <main className="public-flow-shell">
        <section className="public-flow-panel">
          <p className="public-flow-eyebrow">Formulário indisponível</p>
          <h1>Não encontramos este formulário.</h1>
          <p>Confira se o link está correto ou solicite um novo link à empresa.</p>
        </section>
      </main>
    );
  }

  if (loadState === "error" || !flow) {
    return (
      <main className="public-flow-shell">
        <section className="public-flow-panel">
          <p className="public-flow-eyebrow">Algo saiu do esperado</p>
          <h1>Não foi possível carregar o formulário.</h1>
          <p>Tente novamente em instantes.</p>
        </section>
      </main>
    );
  }

  if (screen === "intro") {
    return (
      <main className="public-flow-shell">
        <section className="public-flow-panel intro-panel">
          <p className="public-flow-eyebrow">{flow.company.name}</p>
          <h1>{flow.flow.name}</h1>
          {flow.flow.description ? <p>{flow.flow.description}</p> : null}
          <button
            className="public-flow-primary-button"
            type="button"
            onClick={() => setScreen(questions.length > 0 ? "questions" : "done")}
          >
            Começar
          </button>
        </section>
      </main>
    );
  }

  if (screen === "done") {
    return (
      <main className="public-flow-shell">
        <section className="public-flow-panel">
          <p className="public-flow-eyebrow">{flow.company.name}</p>
          <h1>Tudo pronto!</h1>
          <p>Suas respostas estão preenchidas.</p>
          <button
            className="public-flow-secondary-button"
            type="button"
            onClick={goBack}
          >
            Revisar respostas
          </button>
        </section>
      </main>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const currentAnswer = answers[currentQuestion.id] ?? null;
  const showContinueButton =
    currentQuestion.type !== "SINGLE_CHOICE" && currentQuestion.type !== "BOOLEAN";

  return (
    <main className="public-flow-shell">
      <section className="public-flow-panel question-panel">
        <div className="public-flow-topline">
          <button
            className="public-flow-back-button"
            type="button"
            onClick={currentIndex === 0 ? () => setScreen("intro") : goBack}
          >
            Voltar
          </button>
          <span>
            Pergunta {currentIndex + 1} de {questions.length}
          </span>
        </div>

        <div
          className="public-flow-progress"
          aria-label={`Progresso ${Math.round(progress)}%`}
        >
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="question-content">
          <p className="public-flow-eyebrow">{flow.company.name}</p>
          <h1>{currentQuestion.label}</h1>
          {currentQuestion.description ? <p>{currentQuestion.description}</p> : null}

          <QuestionRenderer
            question={currentQuestion}
            value={currentAnswer}
            onChange={(value) => updateAnswer(currentQuestion.id, value)}
            onSubmit={goNext}
          />

          {validationMessage ? (
            <p className="public-flow-error" role="alert">
              {validationMessage}
            </p>
          ) : null}
        </div>

        <div className="public-flow-actions">
          {!currentQuestion.required ? (
            <button
              className="public-flow-text-button"
              type="button"
              onClick={skipQuestion}
            >
              Pular
            </button>
          ) : (
            <span />
          )}

          {showContinueButton ? (
            <button
              className="public-flow-primary-button"
              type="button"
              onClick={goNext}
            >
              Continuar
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
