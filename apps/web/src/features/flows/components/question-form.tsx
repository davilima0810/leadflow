"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getAllowedSemanticTypes,
  QUESTION_TYPE_LABELS,
  SEMANTIC_TYPE_LABELS
} from "../lib/question-labels";
import type {
  Question,
  QuestionFormValues,
  QuestionSemanticType,
  QuestionType
} from "../types/flow";
import { QuestionOptionsEditor } from "./question-options-editor";

const QUESTION_TYPES = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[];

type QuestionFormProps = {
  error?: string;
  isSubmitting: boolean;
  question?: Question | null;
  onCancel: () => void;
  onSubmit: (values: QuestionFormValues) => void;
};

export function QuestionForm({
  error,
  isSubmitting,
  question,
  onCancel,
  onSubmit
}: QuestionFormProps) {
  const [values, setValues] = useState<QuestionFormValues>({
    label: "",
    description: "",
    type: "TEXT",
    semanticType: "NONE",
    required: true,
    options: []
  });

  useEffect(() => {
    setValues({
      label: question?.label ?? "",
      description: question?.description ?? "",
      type: question?.type ?? "TEXT",
      semanticType: question?.semanticType ?? "NONE",
      required: question?.required ?? true,
      options: question?.options ?? []
    });
  }, [question]);

  const allowedSemanticTypes = useMemo(
    () => getAllowedSemanticTypes(values.type),
    [values.type]
  );
  const isChoiceType =
    values.type === "SINGLE_CHOICE" || values.type === "MULTIPLE_CHOICE";

  function handleTypeChange(type: QuestionType) {
    const nextSemanticTypes = getAllowedSemanticTypes(type);

    setValues((currentValues) => ({
      ...currentValues,
      type,
      semanticType: nextSemanticTypes.includes(currentValues.semanticType)
        ? currentValues.semanticType
        : "NONE",
      options:
        type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE"
          ? currentValues.options.length > 0
            ? currentValues.options
            : [{ label: "", value: "", position: 1 }]
          : []
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form className="flow-form" onSubmit={handleSubmit}>
      <label>
        Pergunta
        <input
          className="private-input"
          value={values.label}
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              label: event.target.value
            }))
          }
          required
        />
      </label>

      <label>
        Descrição
        <textarea
          className="private-textarea"
          rows={3}
          value={values.description}
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              description: event.target.value
            }))
          }
        />
      </label>

      <div className="form-grid">
        <label>
          Tipo de resposta
          <select
            className="private-input"
            value={values.type}
            onChange={(event) => handleTypeChange(event.target.value as QuestionType)}
          >
            {QUESTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {QUESTION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>

        <label>
          Usar esta resposta como
          <select
            className="private-input"
            value={values.semanticType}
            onChange={(event) =>
              setValues((currentValues) => ({
                ...currentValues,
                semanticType: event.target.value as QuestionSemanticType
              }))
            }
          >
            {allowedSemanticTypes.map((semanticType) => (
              <option key={semanticType} value={semanticType}>
                {SEMANTIC_TYPE_LABELS[semanticType]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="field-hint">
        Isso ajuda o LeadFlow a identificar os dados principais do lead.
      </p>

      <label className="checkbox-row">
        <input
          checked={values.required}
          type="checkbox"
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              required: event.target.checked
            }))
          }
        />
        Obrigatória
      </label>

      {isChoiceType ? (
        <QuestionOptionsEditor
          options={values.options}
          onChange={(options) =>
            setValues((currentValues) => ({
              ...currentValues,
              options
            }))
          }
        />
      ) : null}

      {question && !isChoiceType && question.options.length > 0 ? (
        <p className="field-hint">
          Ao salvar como um tipo sem escolhas, as opções existentes deixarão de ser
          utilizadas.
        </p>
      ) : null}

      {error ? (
        <p className="public-flow-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="form-actions">
        <button className="private-secondary-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="private-primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Salvando..." : "Salvar pergunta"}
        </button>
      </div>
    </form>
  );
}
