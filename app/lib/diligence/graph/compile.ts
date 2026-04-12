import { StateGraph, START, END } from '@langchain/langgraph'
import { DiligenceStateAnnotation } from '@/lib/diligence/graph/state'
import {
  loadContextNode,
  screeningNode,
  deterministicNode,
  financialAgentNode,
  riskAgentNode,
  mergeReportNode,
} from '@/lib/diligence/graph/nodes'

function buildCompiledDiligenceGraph() {
  const graph = new StateGraph(DiligenceStateAnnotation)
    .addNode('loadContext', loadContextNode)
    .addNode('screening', screeningNode)
    .addNode('computeDeterministic', deterministicNode)
    .addNode('financialAgent', financialAgentNode)
    .addNode('riskAgent', riskAgentNode)
    .addNode('mergeReport', mergeReportNode)
    .addEdge(START, 'loadContext')
    .addEdge('loadContext', 'screening')
    .addEdge('screening', 'computeDeterministic')
    .addEdge('computeDeterministic', 'financialAgent')
    .addEdge('financialAgent', 'riskAgent')
    .addEdge('riskAgent', 'mergeReport')
    .addEdge('mergeReport', END)

  return graph.compile()
}

let cachedGraph: ReturnType<typeof buildCompiledDiligenceGraph> | null = null

export function getCompiledDiligenceGraph() {
  if (!cachedGraph) {
    cachedGraph = buildCompiledDiligenceGraph()
  }
  return cachedGraph
}
