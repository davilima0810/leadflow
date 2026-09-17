"use client";

import { FormEvent, useEffect, useState } from "react";
import { slugify } from "../lib/slugify";
import type { Flow, FlowFormValues } from "../types/flow";

type FlowFormProps = {
  flow?: Flow | null;
  error?: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: FlowFormValues) => void;
};

export function FlowForm({
  flow,
  error,
  isSubmitting,
  onCancel,
  onSubmit
}: FlowFormProps) {
  const [values, setValues] = useState<FlowFormValues>({
    name: "",
    slug: "",
    description: ""
  });
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    setValues({
      name: flow?.name ?? "",
      slug: flow?.slug ?? "",
      description: flow?.description ?? ""
    });
    setSlugTouched(Boolean(flow));
  }, [flow]);

  function handleNameChange(name: string) {
    setValues((currentValues) => ({
      ...currentValues,
      name,
      slug: slugTouched ? currentValues.slug : slugify(name)
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      ...values,
      slug: slugify(values.slug)
    });
  }

  return (
    <form className="flow-form" onSubmit={handleSubmit}>
      <label>
        Nome
        <input
          className="private-input"
          value={values.name}
          onChange={(event) => handleNameChange(event.target.value)}
          required
        />
      </label>

      <label>
        Slug
        <input
          className="private-input"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          value={values.slug}
          onChange={(event) => {
            setSlugTouched(true);
            setValues((currentValues) => ({
              ...currentValues,
              slug: slugify(event.target.value)
            }));
          }}
          required
        />
      </label>

      <label>
        Descrição
        <textarea
          className="private-textarea"
          rows={4}
          value={values.description}
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              description: event.target.value
            }))
          }
        />
      </label>

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
          {isSubmitting ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
