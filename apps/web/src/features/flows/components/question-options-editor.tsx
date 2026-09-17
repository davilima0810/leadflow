"use client";

import { slugify } from "../lib/slugify";
import type { QuestionOption } from "../types/flow";

type QuestionOptionsEditorProps = {
  options: QuestionOption[];
  onChange: (options: QuestionOption[]) => void;
};

export function QuestionOptionsEditor({
  options,
  onChange
}: QuestionOptionsEditorProps) {
  function updateOption(index: number, changes: Partial<QuestionOption>) {
    onChange(
      options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...changes } : option
      )
    );
  }

  function removeOption(index: number) {
    onChange(
      options
        .filter((_option, optionIndex) => optionIndex !== index)
        .map((option, optionIndex) => ({
          ...option,
          position: optionIndex + 1
        }))
    );
  }

  function addOption() {
    onChange([
      ...options,
      {
        label: "",
        value: "",
        position: options.length + 1
      }
    ]);
  }

  return (
    <div className="options-editor">
      <div>
        <strong>Opções</strong>
        <p>Adicione as alternativas que aparecerão para o visitante.</p>
      </div>

      {options.map((option, index) => (
        <div className="option-row" key={`${option.position}-${index}`}>
          <label>
            Label
            <input
              className="private-input"
              value={option.label}
              onChange={(event) => {
                const label = event.target.value;
                updateOption(index, {
                  label,
                  value: option.value ? option.value : slugify(label)
                });
              }}
              required
            />
          </label>
          <label>
            Valor
            <input
              className="private-input"
              value={option.value}
              onChange={(event) =>
                updateOption(index, {
                  value: slugify(event.target.value)
                })
              }
              required
            />
          </label>
          <button
            aria-label={`Remover opção ${index + 1}`}
            className="icon-button"
            type="button"
            onClick={() => removeOption(index)}
          >
            ×
          </button>
        </div>
      ))}

      <button className="private-secondary-button" type="button" onClick={addOption}>
        + Adicionar opção
      </button>
    </div>
  );
}
