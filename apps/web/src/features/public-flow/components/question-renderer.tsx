"use client";

import type {
  PublicFlowAnswer,
  PublicFlowQuestion
} from "../types/public-flow";
import {
  BooleanQuestionInput,
  DateQuestionInput,
  EmailQuestionInput,
  MultipleChoiceQuestionInput,
  NumberQuestionInput,
  PhoneQuestionInput,
  SingleChoiceQuestionInput,
  TextareaQuestionInput,
  TextQuestionInput,
  TimeQuestionInput
} from "./question-inputs";

type QuestionRendererProps = {
  question: PublicFlowQuestion;
  value: PublicFlowAnswer;
  onChange: (value: PublicFlowAnswer) => void;
  onSubmit: () => void;
};

export function QuestionRenderer(props: QuestionRendererProps) {
  switch (props.question.type) {
    case "TEXT":
      return <TextQuestionInput {...props} />;
    case "TEXTAREA":
      return <TextareaQuestionInput {...props} />;
    case "NUMBER":
      return <NumberQuestionInput {...props} />;
    case "PHONE":
      return <PhoneQuestionInput {...props} />;
    case "EMAIL":
      return <EmailQuestionInput {...props} />;
    case "DATE":
      return <DateQuestionInput {...props} />;
    case "TIME":
      return <TimeQuestionInput {...props} />;
    case "SINGLE_CHOICE":
      return <SingleChoiceQuestionInput {...props} />;
    case "MULTIPLE_CHOICE":
      return <MultipleChoiceQuestionInput {...props} />;
    case "BOOLEAN":
      return <BooleanQuestionInput {...props} />;
  }
}
