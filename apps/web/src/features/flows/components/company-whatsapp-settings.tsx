"use client";

import { useEffect, useState } from "react";
import {
  getCompanySettings,
  updateCompanySettings
} from "../../auth/lib/company-api";
import { ApiRequestError } from "../../auth/lib/private-api";

export function CompanyWhatsappSettings() {
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const company = await getCompanySettings();
        setWhatsappPhone(company.whatsappPhone ?? "");
      } catch {
        setMessage("Não foi possível carregar o WhatsApp da empresa.");
      }
    }

    void load();
  }, []);

  async function save() {
    setIsSaving(true);
    setMessage("");

    try {
      const company = await updateCompanySettings({ whatsappPhone });
      setWhatsappPhone(company.whatsappPhone ?? "");
      setMessage("WhatsApp da empresa salvo.");
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Não foi possível salvar o WhatsApp."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="company-settings-panel">
      <div>
        <h2>WhatsApp da empresa</h2>
        <p>Informe com DDI e DDD. Ex.: 5586999999999</p>
      </div>
      <div className="company-settings-form">
        <input
          className="private-input"
          inputMode="tel"
          maxLength={32}
          placeholder="5586999999999"
          value={whatsappPhone}
          onChange={(event) => setWhatsappPhone(event.target.value)}
        />
        <button
          className="private-secondary-button"
          disabled={isSaving}
          type="button"
          onClick={save}
        >
          {isSaving ? "Salvando..." : "Salvar"}
        </button>
      </div>
      {message ? <p className="private-feedback compact">{message}</p> : null}
    </section>
  );
}
