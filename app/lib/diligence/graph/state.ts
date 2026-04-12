import { Annotation } from '@langchain/langgraph'
import type { DeterministicFit, DiligenceReport, NormalizedScreeningReport } from '@/lib/diligence/schema'

/** Shared LangGraph state for the diligence pipeline */
export const DiligenceStateAnnotation = Annotation.Root({
  applicationId: Annotation<string>(),
  appRow: Annotation<Record<string, unknown>>({
    reducer: (_left, right) => right,
    default: () => ({}),
  }),
  propertyMonthlyRent: Annotation<number | null>({
    reducer: (_left, right) => right,
    default: () => null,
  }),
  propertyAddress: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => '',
  }),
  providerId: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => '',
  }),
  externalOrderId: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => '',
  }),
  vendor: Annotation<NormalizedScreeningReport | null>({
    reducer: (_left, right) => right,
    default: () => null,
  }),
  deterministic: Annotation<DeterministicFit | null>({
    reducer: (_left, right) => right,
    default: () => null,
  }),
  financialAgentText: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => '',
  }),
  riskAgentText: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => '',
  }),
  finalReport: Annotation<DiligenceReport | null>({
    reducer: (_left, right) => right,
    default: () => null,
  }),
})

export type DiligenceGraphState = typeof DiligenceStateAnnotation.State
