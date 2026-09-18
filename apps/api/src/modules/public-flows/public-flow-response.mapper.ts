import type { PublicFlowRecord } from "./public-flow.repository";

export function toPublicFlowResponse(flow: PublicFlowRecord) {
  return {
    company: {
      name: flow.company.name,
      slug: flow.company.slug
    },
    flow: {
      id: flow.id,
      name: flow.name,
      slug: flow.slug,
      description: flow.description,
      appearance: {
        coverImageUrl: flow.coverImageUrl,
        brandImageDisplay: flow.brandImageDisplay,
        primaryColor: flow.primaryColor,
        backgroundColor: flow.backgroundColor,
        backgroundImageUrl: flow.backgroundImageUrl,
        welcomeMessage: flow.welcomeMessage,
        externalLinkUrl: flow.externalLinkUrl,
        externalLinkLabel: flow.externalLinkLabel
      },
      questions: flow.questions.map((question) => ({
        id: question.id,
        label: question.label,
        description: question.description,
        type: question.type,
        semanticType: question.semanticType,
        required: question.required,
        position: question.position,
        options: question.options.map((option) => ({
          id: option.id,
          label: option.label,
          value: option.value,
          position: option.position
        }))
      }))
    }
  };
}
