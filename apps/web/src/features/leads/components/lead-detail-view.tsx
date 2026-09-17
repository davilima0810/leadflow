"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UnauthorizedError } from "../../auth/lib/private-api";
import { getLead } from "../lib/leads-api";
import type { LeadDetail } from "../types/lead";

type LoadState = "loading" | "success" | "error";

type LeadDetailViewProps = {
  leadId: string;
};

export function LeadDetailView({ leadId }: LeadDetailViewProps) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [lead, setLead] = useState<LeadDetail | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLead() {
      try {
        const loadedLead = await getLead(leadId);

        if (!active) {
          return;
        }

        setLead(loadedLead);
        setLoadState("success");
      } catch (error) {
        if (!active) {
          return;
        }

        if (error instanceof UnauthorizedError) {
          router.push("/login");
          return;
        }

        setLoadState("error");
      }
    }

    void loadLead();

    return () => {
      active = false;
    };
  }, [leadId, router]);

  return (
      <section className="private-page">
        <header className="private-header">
          <div>
            <p className="private-eyebrow">Lead</p>
            <h1>{lead?.flow.name ?? "Carregando lead"}</h1>
            {lead ? <p>Recebido em {formatDate(lead.createdAt)}</p> : null}
          </div>
          <Link className="private-secondary-button" href="/leads">
            Voltar
          </Link>
        </header>

        {loadState === "loading" ? <p>Carregando detalhes...</p> : null}

        {loadState === "error" ? (
          <section className="private-panel">
            <h2>Não foi possível carregar este lead.</h2>
            <p>Ele pode não existir ou pertencer a outra empresa.</p>
          </section>
        ) : null}

        {loadState === "success" && lead ? (
          <div className="lead-detail-grid">
            <section className="private-panel answer-panel">
              <div className="contact-summary">
                <h2>{lead.contact.name ?? "Contato não identificado"}</h2>
                {lead.contact.phone ? <p>{lead.contact.phone}</p> : null}
                {lead.contact.email ? <p>{lead.contact.email}</p> : null}
                {lead.whatsappUrl ? (
                  <a
                    className="private-primary-button"
                    href={lead.whatsappUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Conversar no WhatsApp
                  </a>
                ) : null}
              </div>

              <h2>Respostas</h2>
              <div className="answer-list">
                {lead.answers.map((answer) => (
                  <div className="answer-item" key={answer.questionId}>
                    <h3>{answer.question}</h3>
                    <p>{formatAnswer(answer.displayValue)}</p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="private-panel summary-panel">
              <h2>Resumo</h2>
              <pre>{lead.summary}</pre>
              {!lead.whatsappUrl ? <p>Telefone do lead não identificado.</p> : null}
            </aside>
          </div>
        ) : null}
      </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatAnswer(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (value === null || value === undefined || value === "") {
    return "Sem resposta";
  }

  return String(value);
}
