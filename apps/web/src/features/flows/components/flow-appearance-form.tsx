"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_PRIMARY_COLOR,
  getContrastTextColor,
  isHexColor,
  normalizeHexColor
} from "../lib/flow-appearance";
import type { Flow, FlowAppearanceFormValues } from "../types/flow";
import { BrandImage } from "./brand-image";

type FlowAppearanceFormProps = {
  error: string;
  flow: Flow;
  isUploadingBackground: boolean;
  isUploadingLogo: boolean;
  isSubmitting: boolean;
  onBackgroundRemove: () => void;
  onBackgroundUpload: (file: File) => void;
  onLogoRemove: () => void;
  onLogoUpload: (file: File) => void;
  onSubmit: (values: FlowAppearanceFormValues) => void;
};

export function FlowAppearanceForm({
  error,
  flow,
  isUploadingBackground,
  isUploadingLogo,
  isSubmitting,
  onBackgroundRemove,
  onBackgroundUpload,
  onLogoRemove,
  onLogoUpload,
  onSubmit
}: FlowAppearanceFormProps) {
  const [values, setValues] = useState<FlowAppearanceFormValues>(() =>
    toInitialValues(flow)
  );

  useEffect(() => {
    setValues(toInitialValues(flow));
  }, [flow]);

  const primaryColor = isHexColor(values.primaryColor)
    ? normalizeHexColor(values.primaryColor)
    : DEFAULT_PRIMARY_COLOR;
  const backgroundColor = isHexColor(values.backgroundColor)
    ? normalizeHexColor(values.backgroundColor)
    : DEFAULT_BACKGROUND_COLOR;
  const primaryContrast = useMemo(
    () => getContrastTextColor(primaryColor),
    [primaryColor]
  );
  const previewBackgroundStyle = values.backgroundImageUrl
    ? `linear-gradient(rgba(17, 24, 39, 0.42), rgba(17, 24, 39, 0.42)), url("${values.backgroundImageUrl}")`
    : backgroundColor;
  const canSubmit =
    isHexColor(values.primaryColor) && isHexColor(values.backgroundColor);

  function updateField(field: keyof FlowAppearanceFormValues, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]:
        field === "primaryColor" || field === "backgroundColor"
          ? value.toUpperCase()
          : value
    }));
  }

  function restoreDefaultColors() {
    setValues((currentValues) => ({
      ...currentValues,
      primaryColor: DEFAULT_PRIMARY_COLOR,
      backgroundColor: DEFAULT_BACKGROUND_COLOR
    }));
  }

  return (
    <section className="builder-section appearance-section">
      <div className="section-heading">
        <div>
          <h2>Identidade visual</h2>
          <p>Personalize como este atendimento aparece para seus clientes.</p>
        </div>
      </div>

      <div className="appearance-grid">
        <form
          className="appearance-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({
              ...values,
              primaryColor: normalizeHexColor(values.primaryColor),
              backgroundColor: normalizeHexColor(values.backgroundColor)
            });
          }}
        >
          <div className="upload-field">
            <div>
              <strong>Logo</strong>
              <p>JPEG, PNG ou WebP até 2 MB.</p>
            </div>
            {flow.coverImageUrl ? (
              <BrandImage
                className="upload-brand-image"
                display={values.brandImageDisplay}
                src={flow.coverImageUrl}
              />
            ) : null}
            <div className="upload-actions">
              <label className="private-secondary-button">
                {isUploadingLogo ? "Enviando..." : "Escolher logo"}
                <input
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isUploadingLogo}
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      onLogoUpload(file);
                    }
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              {flow.coverImageUrl ? (
                <button
                  className="private-secondary-button"
                  disabled={isUploadingLogo}
                  type="button"
                  onClick={onLogoRemove}
                >
                  Remover
                </button>
              ) : null}
            </div>
          </div>

          <fieldset className="display-choice-group">
            <legend>Como deseja exibir sua imagem?</legend>
            <label className="display-choice-card">
              <input
                checked={values.brandImageDisplay === "LOGO"}
                name="brandImageDisplay"
                type="radio"
                value="LOGO"
                onChange={() => updateField("brandImageDisplay", "LOGO")}
              />
              <span className="display-choice-visual" data-display="LOGO" />
              <span>
                <strong>Logo</strong>
                <small>Exibição tradicional, ideal para empresas e marcas.</small>
              </span>
            </label>
            <label className="display-choice-card">
              <input
                checked={values.brandImageDisplay === "PROFILE"}
                name="brandImageDisplay"
                type="radio"
                value="PROFILE"
                onChange={() => updateField("brandImageDisplay", "PROFILE")}
              />
              <span className="display-choice-visual" data-display="PROFILE" />
              <span>
                <strong>Foto de perfil</strong>
                <small>
                  Exibição circular, ideal para profissionais e atendimento pessoal.
                </small>
              </span>
            </label>
          </fieldset>

          <div className="appearance-color-grid">
            <label>
              Cor principal
              <span className="color-field">
                <input
                  aria-label="Selecionar cor principal"
                  type="color"
                  value={primaryColor}
                  onChange={(event) =>
                    updateField("primaryColor", event.target.value)
                  }
                />
                <input
                  className="private-input"
                  maxLength={7}
                  value={values.primaryColor}
                  onChange={(event) =>
                    updateField("primaryColor", event.target.value)
                  }
                />
              </span>
            </label>

            <label>
              Cor de fundo
              <span className="color-field">
                <input
                  aria-label="Selecionar cor de fundo"
                  type="color"
                  value={backgroundColor}
                  onChange={(event) =>
                    updateField("backgroundColor", event.target.value)
                  }
                />
                <input
                  className="private-input"
                  maxLength={7}
                  value={values.backgroundColor}
                  onChange={(event) =>
                    updateField("backgroundColor", event.target.value)
                  }
                />
              </span>
            </label>
          </div>

          <label>
            Mensagem inicial
            <textarea
              className="private-textarea"
              maxLength={280}
              placeholder="Olá! Vamos encontrar a melhor opção para você."
              value={values.welcomeMessage}
              onChange={(event) =>
                updateField("welcomeMessage", event.target.value)
              }
            />
          </label>

          <div className="upload-field">
            <div>
              <strong>Imagem de fundo</strong>
              <p>Opcional. Se não houver imagem, a cor de fundo será usada.</p>
            </div>
            {flow.backgroundImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={flow.backgroundImageUrl} className="backgroundImageUrl"/>
            ) : null}
            <div className="upload-actions">
              <label className="private-secondary-button">
                {isUploadingBackground ? "Enviando..." : "Escolher fundo"}
                <input
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isUploadingBackground}
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      onBackgroundUpload(file);
                    }
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              {flow.backgroundImageUrl ? (
                <button
                  className="private-secondary-button"
                  disabled={isUploadingBackground}
                  type="button"
                  onClick={onBackgroundRemove}
                >
                  Remover
                </button>
              ) : null}
            </div>
          </div>

          <div className="appearance-color-grid">
            <label>
              Texto do link externo
              <input
                className="private-input"
                maxLength={80}
                placeholder="Ver nosso catálogo"
                value={values.externalLinkLabel}
                onChange={(event) =>
                  updateField("externalLinkLabel", event.target.value)
                }
              />
            </label>
            <label>
              URL do link externo
              <input
                className="private-input"
                maxLength={2048}
                placeholder="https://empresa.com/catalogo"
                type="url"
                value={values.externalLinkUrl}
                onChange={(event) =>
                  updateField("externalLinkUrl", event.target.value)
                }
              />
            </label>
          </div>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          {!canSubmit ? (
            <p className="form-error" role="alert">
              Use cores no formato #2563EB.
            </p>
          ) : null}

          <div className="form-actions">
            <button
              className="private-secondary-button"
              type="button"
              onClick={restoreDefaultColors}
            >
              Restaurar padrão
            </button>
            <button
              className="private-primary-button"
              disabled={isSubmitting || !canSubmit}
              type="submit"
            >
              {isSubmitting ? "Salvando..." : "Salvar aparência"}
            </button>
          </div>
        </form>

        <div
          className="appearance-preview"
          style={
            {
              "--preview-background": backgroundColor,
              "--preview-background-image": previewBackgroundStyle,
              "--preview-primary": primaryColor,
              "--preview-primary-contrast": primaryContrast
            } as CSSProperties
          }
        >
          <BrandImage
            className="appearance-preview-image"
            display={values.brandImageDisplay}
            src={values.coverImageUrl}
          />
          <div>
            <p>{values.welcomeMessage || flow.description || flow.name}</p>
            <span className="preview-progress">
              <span />
            </span>
            <button type="button">Continuar</button>
            {values.externalLinkUrl && values.externalLinkLabel ? (
              <a href={values.externalLinkUrl}>{values.externalLinkLabel} ↗</a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function toInitialValues(flow: Flow): FlowAppearanceFormValues {
  return {
    coverImageUrl: flow.coverImageUrl ?? "",
    brandImageDisplay: flow.brandImageDisplay ?? "LOGO",
    primaryColor: flow.primaryColor ?? DEFAULT_PRIMARY_COLOR,
    backgroundColor: flow.backgroundColor ?? DEFAULT_BACKGROUND_COLOR,
    backgroundImageUrl: flow.backgroundImageUrl ?? "",
    welcomeMessage: flow.welcomeMessage ?? "",
    externalLinkUrl: flow.externalLinkUrl ?? "",
    externalLinkLabel: flow.externalLinkLabel ?? ""
  };
}
