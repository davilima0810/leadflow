"use client";

import type { Question } from "../types/flow";
import { QuestionCard } from "./question-card";

type QuestionListProps = {
  pendingQuestionId: string | null;
  questions: Question[];
  onDelete: (question: Question) => void;
  onEdit: (question: Question) => void;
  onMoveDown: (question: Question) => void;
  onMoveUp: (question: Question) => void;
};

export function QuestionList({
  pendingQuestionId,
  questions,
  onDelete,
  onEdit,
  onMoveDown,
  onMoveUp
}: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <section className="private-panel empty-state">
        <h2>Nenhuma pergunta configurada.</h2>
        <p>Adicione a primeira pergunta para poder publicar este Flow.</p>
      </section>
    );
  }

  return (
    <div className="question-list">
      {questions.map((question, index) => (
        <QuestionCard
          index={index}
          isFirst={index === 0}
          isLast={index === questions.length - 1}
          key={question.id}
          pendingQuestionId={pendingQuestionId}
          question={question}
          onDelete={onDelete}
          onEdit={onEdit}
          onMoveDown={onMoveDown}
          onMoveUp={onMoveUp}
        />
      ))}
    </div>
  );
}
