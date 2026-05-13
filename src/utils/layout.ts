import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@xyflow/react'
import type { FactoryResult, ProductionStep, RawRecipe } from '../types'
import type { MinerConfig } from '../data/miners'
import { DEFAULT_MINER_CONFIG } from '../data/miners'
import { getRecipesForItem } from '../data/loader'
import type { SectionNodeData } from '../nodes/SectionNode'
import { SECTION_HEADER_H } from '../nodes/SectionNode'

// ── Constants ────────────────────────────────────────────────────────────────
const NODE_W = 270
const NODE_GAP = 8
const RAW_NODE_H = 190
const POOL_NODE_W = 130
const POOL_NODE_H = 60
const NODE_SEP = 60
const RANK_SEP = 100

const SECTION_INNER_GAP = 6   // gap between header and first machine card
const SECTION_PAD_BOTTOM = 8  // padding below last machine card

// Machine node height components (must match MachineNode.tsx rendering)
const MACHINE_HEADER_H = 64
const COL_HEADER_H = 20
const ROW_H = 32

function machineNodeHeight(step: ProductionStep): number {
  return (
    MACHINE_HEADER_H +
    COL_HEADER_H +
    Math.max(step.inputRates.length, step.outputRates.length) * ROW_H +
    8
  )
}

function sectionTotalHeight(step: ProductionStep): number {
  const machH = machineNodeHeight(step)
  return (
    SECTION_HEADER_H +
    SECTION_INNER_GAP +
    step.instanceCount * machH +
    Math.max(0, step.instanceCount - 1) * NODE_GAP +
    SECTION_PAD_BOTTOM
  )
}

// ── Node data types ───────────────────────────────────────────────────────────
export type MachineNodeData = {
  step: ProductionStep
  instanceIndex: number
  instanceCount: number
  perMachineClock: number
  perMachineInputs: { item: string; rate: number }[]
  perMachineOutputs: { item: string; rate: number }[]
  availableRecipes: RawRecipe[]
  onRecipeChange: (item: string, recipeName: string) => void
}

export type RawNodeData = {
  item: string
  minerConfig: MinerConfig
  onMinerConfigChange: (item: string, config: MinerConfig) => void
  availableRecipes: RawRecipe[]
  onRecipeChange: (item: string, recipeName: string) => void
}

export type PoolNodeData = {
  item: string
  totalRate: number
}

export function machineNodeId(stepId: string, i: number): string {
  return `${stepId}|m${i}`
}

export function sectionNodeId(stepId: string): string {
  return `section||${stepId}`
}

export function poolNodeId(stepId: string, item: string): string {
  return `pool||${stepId}||${item}`
}

// ── Edge helper ───────────────────────────────────────────────────────────────
function makeEdge(
  id: string,
  source: string,
  target: string,
  sourceHandle: string,
  targetHandle: string,
  rate: number,
): Edge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    label: `${rate.toFixed(1)}/min`,
    labelStyle: { fill: '#94a3b8', fontSize: 10 },
    labelBgStyle: { fill: '#1e293b' },
    style: { stroke: '#475569', strokeWidth: 2 },
    type: 'smoothstep',
    data: { rate },
  }
}

// ── Build React Flow nodes + edges from factory result ───────────────────────
export function buildFlowGraph(
  result: FactoryResult,
  callbacks: {
    onMinerConfigChange: (item: string, config: MinerConfig) => void
    onRecipeChange: (item: string, recipeName: string) => void
  },
  existingPositions: Map<string, { x: number; y: number }>,
  minerConfigs: Map<string, MinerConfig>,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const edgeSet = new Set<string>()

  // ── Section nodes (one per step, acts as parent group) ────────────────────
  for (const [stepId, step] of result.steps) {
    const sid = sectionNodeId(stepId)
    const secH = sectionTotalHeight(step)
    nodes.push({
      id: sid,
      type: 'section',
      data: {
        itemName: step.itemName,
        machineName: step.machineName,
        instanceCount: step.instanceCount,
        totalRate: step.totalRate,
        fullHeight: secH,
        inputItems: step.inputRates.map(r => r.item),
        outputItems: step.outputRates.map(r => r.item),
        collapsed: true,
      } satisfies SectionNodeData,
      position: existingPositions.get(sid) ?? { x: 0, y: 0 },
      style: { width: NODE_W, height: SECTION_HEADER_H },
      className: 'section-node',
    })
  }

  // ── Machine nodes (children of their section, not draggable individually) ──
  for (const [stepId, step] of result.steps) {
    const sid = sectionNodeId(stepId)
    const machH = machineNodeHeight(step)
    const perInput = step.inputRates.map(r => ({
      item: r.item,
      rate: r.rate / step.instanceCount,
    }))
    const perOutput = step.outputRates.map(r => ({
      item: r.item,
      rate: r.rate / step.instanceCount,
    }))

    for (let i = 0; i < step.instanceCount; i++) {
      const nodeId = machineNodeId(stepId, i)
      nodes.push({
        id: nodeId,
        type: 'machine',
        parentId: sid,
        data: {
          step,
          instanceIndex: i,
          instanceCount: step.instanceCount,
          perMachineClock: step.clockSpeed,
          perMachineInputs: perInput,
          perMachineOutputs: perOutput,
          availableRecipes: getRecipesForItem(step.itemName),
          onRecipeChange: callbacks.onRecipeChange,
        } satisfies MachineNodeData,
        position: {
          x: 0,
          y: SECTION_HEADER_H + SECTION_INNER_GAP + i * (machH + NODE_GAP),
        },
        draggable: false,
        hidden: true,
      })
    }
  }

  // ── Pool nodes (one per output item per step) ─────────────────────────────
  for (const [, step] of result.steps) {
    for (const out of step.outputRates) {
      const nid = poolNodeId(step.id, out.item)
      nodes.push({
        id: nid,
        type: 'pool',
        data: { item: out.item, totalRate: out.rate } satisfies PoolNodeData,
        position: existingPositions.get(nid) ?? { x: 0, y: 0 },
      })
    }
  }

  // ── Raw material nodes ────────────────────────────────────────────────────
  for (const [item] of result.rawMaterials) {
    const nodeId = `raw||${item}`
    nodes.push({
      id: nodeId,
      type: 'rawMaterial',
      data: {
        item,
        minerConfig: minerConfigs.get(item) ?? DEFAULT_MINER_CONFIG,
        onMinerConfigChange: callbacks.onMinerConfigChange,
        availableRecipes: getRecipesForItem(item),
        onRecipeChange: callbacks.onRecipeChange,
      } satisfies RawNodeData,
      position: existingPositions.get(nodeId) ?? { x: 0, y: 0 },
    })
  }

  // ── Edges: section → pool ────────────────────────────────────────────────
  for (const step of result.steps.values()) {
    const sid = sectionNodeId(step.id)
    for (const out of step.outputRates) {
      const pid = poolNodeId(step.id, out.item)
      const eid = `${sid}→${pid}→${out.item}`
      if (edgeSet.has(eid)) continue
      edgeSet.add(eid)
      edges.push(makeEdge(eid, sid, pid, `sec-out-${out.item}`, `in-${out.item}`, out.rate))
    }
  }

  // ── Edges: pool / raw → section inputs ───────────────────────────────────
  for (const step of result.steps.values()) {
    const sid = sectionNodeId(step.id)
    for (const inp of step.inputRates) {
      const sourceStep = [...result.steps.values()].find(s =>
        s.outputRates.some(o => o.item === inp.item),
      )
      const sourceId = sourceStep
        ? poolNodeId(sourceStep.id, inp.item)
        : result.rawMaterials.has(inp.item)
          ? `raw||${inp.item}`
          : null
      if (!sourceId) continue

      const eid = `${sourceId}→${sid}→${inp.item}`
      if (edgeSet.has(eid)) continue
      edgeSet.add(eid)
      edges.push(makeEdge(eid, sourceId, sid, `out-${inp.item}`, `sec-in-${inp.item}`, inp.rate))
    }
  }

  // ── Dagre layout (section-level, not machine-level) ───────────────────────
  const needsLayout =
    [...result.steps.values()].some(s => !existingPositions.has(sectionNodeId(s.id))) ||
    [...result.rawMaterials.keys()].some(item => !existingPositions.has(`raw||${item}`))

  if (needsLayout) {
    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: 'LR', nodesep: NODE_SEP, ranksep: RANK_SEP })
    g.setDefaultEdgeLabel(() => ({}))

    // Section representatives — use collapsed height since sections start collapsed
    for (const [stepId] of result.steps) {
      g.setNode(sectionNodeId(stepId), {
        width: NODE_W,
        height: SECTION_HEADER_H,
      })
    }
    // Pool nodes
    for (const [, step] of result.steps) {
      for (const out of step.outputRates) {
        g.setNode(poolNodeId(step.id, out.item), { width: POOL_NODE_W, height: POOL_NODE_H })
      }
    }
    // Raw material nodes
    for (const item of result.rawMaterials.keys()) {
      g.setNode(`raw||${item}`, { width: NODE_W, height: RAW_NODE_H })
    }

    // Edges: section → pool → consumer section,  raw → consumer section
    for (const [, step] of result.steps) {
      for (const out of step.outputRates) {
        g.setEdge(sectionNodeId(step.id), poolNodeId(step.id, out.item))
      }
    }
    for (const step of result.steps.values()) {
      for (const inp of step.inputRates) {
        const sourceStep = [...result.steps.values()].find(s =>
          s.outputRates.some(o => o.item === inp.item),
        )
        const sourceId = sourceStep
          ? poolNodeId(sourceStep.id, inp.item)
          : result.rawMaterials.has(inp.item)
            ? `raw||${inp.item}`
            : null
        if (sourceId) g.setEdge(sourceId, sectionNodeId(step.id))
      }
    }

    dagre.layout(g)

    // Apply section positions
    for (const [stepId] of result.steps) {
      const sid = sectionNodeId(stepId)
      if (existingPositions.has(sid)) continue
      const gNode = g.node(sid)
      if (!gNode) continue
      const node = nodes.find(n => n.id === sid)
      if (node) {
        node.position = { x: gNode.x - gNode.width / 2, y: gNode.y - gNode.height / 2 }
      }
    }

    // Apply pool positions
    for (const [, step] of result.steps) {
      for (const out of step.outputRates) {
        const pid = poolNodeId(step.id, out.item)
        if (existingPositions.has(pid)) continue
        const gNode = g.node(pid)
        if (!gNode) continue
        const node = nodes.find(n => n.id === pid)
        if (node) {
          node.position = { x: gNode.x - gNode.width / 2, y: gNode.y - gNode.height / 2 }
        }
      }
    }

    // Apply raw material positions
    for (const item of result.rawMaterials.keys()) {
      const rawId = `raw||${item}`
      if (existingPositions.has(rawId)) continue
      const gNode = g.node(rawId)
      if (!gNode) continue
      const node = nodes.find(n => n.id === rawId)
      if (node) {
        node.position = { x: gNode.x - gNode.width / 2, y: gNode.y - gNode.height / 2 }
      }
    }
  }

  return { nodes, edges }
}

// ── Re-layout with current node heights (called after collapse/expand) ────────
export function reflow(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: NODE_SEP, ranksep: RANK_SEP })
  g.setDefaultEdgeLabel(() => ({}))

  for (const node of nodes) {
    if (node.type === 'section') {
      g.setNode(node.id, { width: NODE_W, height: (node.style?.height as number) ?? SECTION_HEADER_H })
    } else if (node.type === 'pool') {
      g.setNode(node.id, { width: POOL_NODE_W, height: POOL_NODE_H })
    } else if (node.type === 'rawMaterial') {
      g.setNode(node.id, { width: NODE_W, height: RAW_NODE_H })
    }
  }

  for (const edge of edges) {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  }

  dagre.layout(g)

  return nodes.map(node => {
    if (node.type === 'machine') return node
    const gNode = g.node(node.id)
    if (!gNode) return node
    return {
      ...node,
      position: { x: gNode.x - gNode.width / 2, y: gNode.y - gNode.height / 2 },
    }
  })
}
