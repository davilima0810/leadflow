"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UnauthorizedError } from "../../auth/lib/private-api";
import { getLeads } from "../lib/leads-api";
import type { LeadListItem } from "../types/lead";

type LoadState = "loading" | "success" | "empty" | "error";

export function LeadsInbox() {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [leads, setLeads] = useState<LeadListItem[]>([]);

  useEffect(() => {
    let active = true;

    async function loadLeads() {
      try {
        const loadedLeads = await getLeads();

        if (!active) {
          return;
        }

        setLeads(loadedLeads);
        setLoadState(loadedLeads.length > 0 ? "success" : "empty");
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

    void loadLeads();

    return () => {
      active = false;
    };
  }, [router]);

  return (
      <section className="private-page">
        <header className="private-header">
          <div>
            <p className="private-eyebrow">LeadFlow</p>
            <h1>Leads</h1>
          </div>
          <Link className="private-secondary-button" href="/login">
            Login
          </Link>
        </header>

        {loadState === "loading" ? <p>Carregando leads...</p> : null}

        {loadState === "empty" ? (
          <section className="private-panel">
            <h2>Você ainda não recebeu nenhum lead.</h2>
            <p>Quando alguém responder um flow publicado, ele aparecerá aqui.</p>
          </section>
        ) : null}

        {loadState === "error" ? (
          <section className="private-panel">
            <h2>Não foi possível carregar os leads.</h2>
            <p>Tente novamente em instantes.</p>
          </section>
        ) : null}

        {loadState === "success" ? (
          <div className="lead-list">
            {leads.map((lead) => (
              <article className="lead-row" key={lead.id}>
                <div>
                  <h2>{lead.flow.name}</h2>
                  <p>{formatDate(lead.createdAt)}</p>
                </div>
                <Link className="private-primary-button" href={`/leads/${lead.id}`}>
                  Abrir
                </Link>
              </article>
            ))}
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
