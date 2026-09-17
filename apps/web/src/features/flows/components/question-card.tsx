"use client";

import {
  QUESTION_TYPE_LABELS,
  SEMANTIC_TYPE_LABELS
} from "../lib/question-labels";
import type { Question } from "../types/flow";

type QuestionCardProps = {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  pendingQuestionId: string | null;
  question: Question;
  onDelete: (question: Question) => void;
  onEdit: (question: Question) => void;
  onMoveDown: (question: Question) => void;
  onMoveUp: (question: Question) => void;
};

export function QuestionCard({
  index,
  isFirst,
  isLast,
  pendingQuestionId,
  question,
  onDelete,
  onEdit,
  onMoveDown,
  onMoveUp
}: QuestionCardProps) {
  const isPending = pendingQuestionId === question.id;

  return (
    <article className="question-card">
      <div className="question-position">{index + 1}</div>
      <div className="question-card-body">
        <div className="question-card-header">
          <div>
            <h2>{question.label}</h2>
            {question.description ? <p>{question.description}</p> : null}
          </div>
          <div className="question-tags">
            <span>{QUESTION_TYPE_LABELS[question.type]}</span>
            {question.semanticType !== "NONE" ? (
              <span>{SEMANTIC_TYPE_LABELS[question.semanticType]}</span>
            ) : null}
            {question.required ? <span>Obrigatória</span> : <span>Opcional</span>}
          </div>
        </div>

        {question.options.length > 0 ? (
          <ul className="question-options-list">
            {question.options.map((option) => (
              <li key={`${question.id}-${option.value}`}>
                {option.label}
                <code>{option.value}</code>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="question-actions">
          <button
            aria-label={`Mover pergunta ${index + 1} para cima`}
            className="private-secondary-button"
            disabled={isFirst || isPending}
            type="button"
            onClick={() => onMoveUp(question)}
          >
            ↑
          </button>
          <button
            aria-label={`Mover pergunta ${index + 1} para baixo`}
            className="private-secondary-button"
            disabled={isLast || isPending}
            type="button"
            onClick={() => onMoveDown(question)}
          >
            ↓
          </button>
          <button
            className="private-secondary-button"
            disabled={isPending}
            type="button"
            onClick={() => onEdit(question)}
          >
            Editar
          </button>
          <button
            className="private-danger-button"
            disabled={isPending}
            type="button"
            onClick={() => onDelete(question)}
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </article>
  );
}
