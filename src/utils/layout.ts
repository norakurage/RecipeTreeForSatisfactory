import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@xyflow/react'
import type { FactoryResult, ProductionStep } from '../types'

// ── Constants ────────────────────────────────────────────────────────────────
const NODE_W = 270
const PROD_NODE_BASE_H = 180   // header + footer; inputs/outputs add to this
const RAW_NODE_H = 72
const ROW_H = 22
const NODE_SEP = 60
const RANK_SEP = 120

export type ProdNodeData = {
  step: ProductionStep
  onClockChange: (stepId: string, clock: number) => void
}
export type RawNodeData = { item: string; rate: number }

function productionNodeHeight(step: ProductionStep): number {
  return (
    PROD_NODE_BASE_H +
    step.inputRates.length * ROW_H +
    step.outputRates.length * ROW_H
  )
}

// ── Build React Flow nodes + edges from factory result ───────────────────────
export function buildFlowGraph(
  result: FactoryResult,
  onClockChange: (stepId: string, clock: number) => void,
  existingPositions: Map<string, { x: number; y: number }>,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Production step nodes
  for (const [stepId, step] of result.steps) {
    nodes.push({
      id: stepId,
      type: 'production',
      data: { step, onClockChange } satisfies ProdNodeData,
      position: existingPositions.get(stepId) ?? { x: 0, y: 0 },
    })
  }

  // Raw material nodes
  for (const [item, rate] of result.rawMaterials) {
    const nodeId = `raw||${item}`
    nodes.push({
      id: nodeId,
      type: 'rawMaterial',
      data: { item, rate } satisfies RawNodeData,
      position: existingPositions.get(nodeId) ?? { x: 0, y: 0 },
    })
  }

  // Edges: connect each step's inputs to their source
  const edgeSet = new Set<string>()
  for (const step of result.steps.values()) {
    for (const inp of step.inputRates) {
      // Find which step produces this item
      const sourceStep = [...result.steps.values()].find(s =>
        s.outputRates.some(o => o.item === inp.item),
      )

      const sourceId = sourceStep
        ? sourceStep.id
        : result.rawMaterials.has(inp.item)
          ? `raw||${inp.item}`
          : null

      if (!sourceId) continue

      const edgeId = `${sourceId}→${step.id}→${inp.item}`
      if (edgeSet.has(edgeId)) continue
      edgeSet.add(edgeId)

      edges.push({
        id: edgeId,
        source: sourceId,
        target: step.id,
        sourceHandle: `out-${inp.item}`,
        targetHandle: `in-${inp.item}`,
        label: `${inp.rate.toFixed(1)}/min`,
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        labelBgStyle: { fill: '#1e293b' },
        style: { stroke: '#475569', strokeWidth: 2 },
        type: 'smoothstep',
        data: { item: inp.item, rate: inp.rate },
      })
    }
  }

  // ── Dagre layout for nodes without stored positions ─────────────────────
  const newNodeIds = new Set(
    nodes
      .filter(n => !existingPositions.has(n.id))
      .map(n => n.id),
  )

  if (newNodeIds.size > 0) {
    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: 'LR', nodesep: NODE_SEP, ranksep: RANK_SEP })
    g.setDefaultEdgeLabel(() => ({}))

    for (const node of nodes) {
      const h =
        node.type === 'production'
          ? productionNodeHeight((node.data as ProdNodeData).step)
          : RAW_NODE_H
      g.setNode(node.id, { width: NODE_W, height: h })
    }
    for (const edge of edges) {
      g.setEdge(edge.source, edge.target)
    }

    dagre.layout(g)

    for (const node of nodes) {
      if (!existingPositions.has(node.id)) {
        const { x, y, width, height } = g.node(node.id)
        node.position = { x: x - width / 2, y: y - height / 2 }
      }
    }
  }

  return { nodes, edges }
}
