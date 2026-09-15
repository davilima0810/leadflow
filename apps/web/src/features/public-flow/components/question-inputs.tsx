"use client";

import type {
  PublicFlowAnswer,
  PublicFlowQuestion
} from "../types/public-flow";

type QuestionInputProps = {
  question: PublicFlowQuestion;
  value: PublicFlowAnswer;
  onChange: (value: PublicFlowAnswer) => void;
  onSubmit?: () => void;
};

export function TextQuestionInput({
  question,
  value,
  onChange
}: QuestionInputProps) {
  return (
    <input
      aria-label={question.label}
      className="public-flow-input"
      type="text"
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function TextareaQuestionInput({
  question,
  value,
  onChange
}: QuestionInputProps) {
  return (
    <textarea
      aria-label={question.label}
      className="public-flow-textarea"
      rows={5}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function NumberQuestionInput({
  question,
  value,
  onChange
}: QuestionInputProps) {
  return (
    <input
      aria-label={question.label}
      className="public-flow-input"
      inputMode="numeric"
      type="number"
      value={typeof value === "number" || typeof value === "string" ? value : ""}
      onChange={(event) =>
        onChange(event.target.value === "" ? null : Number(event.target.value))
      }
    />
  );
}

export function PhoneQuestionInput({
  question,
  value,
  onChange
}: QuestionInputProps) {
  return (
    <input
      aria-label={question.label}
      className="public-flow-input"
      inputMode="tel"
      type="tel"
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function EmailQuestionInput({
  question,
  value,
  onChange
}: QuestionInputProps) {
  return (
    <input
      aria-label={question.label}
      className="public-flow-input"
      type="email"
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function DateQuestionInput({
  question,
  value,
  onChange
}: QuestionInputProps) {
  return (
    <input
      aria-label={question.label}
      className="public-flow-input"
      type="date"
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function TimeQuestionInput({
  question,
  value,
  onChange
}: QuestionInputProps) {
  return (
    <input
      aria-label={question.label}
      className="public-flow-input"
      type="time"
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function SingleChoiceQuestionInput({
  question,
  value,
  onChange,
  onSubmit
}: QuestionInputProps) {
  return (
    <div className="choice-list" role="radiogroup" aria-label={question.label}>
      {question.options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            className="choice-button"
            data-selected={selected}
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              onChange(option.value);
              window.setTimeout(() => onSubmit?.(), 120);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function MultipleChoiceQuestionInput({
  question,
  value,
  onChange
}: QuestionInputProps) {
  const selectedValues = Array.isArray(value) ? value : [];

  return (
    <div className="choice-list" aria-label={question.label}>
      {question.options.map((option) => {
        const selected = selectedValues.includes(option.value);

        return (
          <button
            className="choice-button"
            data-selected={selected}
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              onChange(
                selected
                  ? selectedValues.filter((item) => item !== option.value)
                  : [...selectedValues, option.value]
              );
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function BooleanQuestionInput({
  question,
  value,
  onChange,
  onSubmit
}: QuestionInputProps) {
  return (
    <div className="choice-list compact" role="radiogroup" aria-label={question.label}>
      {[
        { label: "Sim", value: true },
        { label: "Não", value: false }
      ].map((option) => {
        const selected = value === option.value;

        return (
          <button
            className="choice-button"
            data-selected={selected}
            key={option.label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              onChange(option.value);
              window.setTimeout(() => onSubmit?.(), 120);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
