import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react'
import type { FactoryResult, ProductionGoal } from '../types'
import { resolveRecipeTree } from '../logic/resolveRecipeTree'
import { buildFlowGraph, machineNodeId } from '../utils/layout'
import { getRecipesForItem } from '../data/loader'
import type { MinerConfig } from '../data/miners'

interface FactoryStore {
  // ── User inputs ────────────────────────────────────────────────────────────
  goal: ProductionGoal | null
  recipeOverrides: Map<string, string>   // itemName → recipeName
  minerConfigs: Map<string, MinerConfig> // itemName → { mk, purity, clockSpeed, sommersloop }

  // ── Computed ───────────────────────────────────────────────────────────────
  factoryResult: FactoryResult | null

  // ── React Flow state ───────────────────────────────────────────────────────
  nodes: Node[]
  edges: Edge[]
  nodePositions: Map<string, { x: number; y: number }>

  // ── Actions ────────────────────────────────────────────────────────────────
  setGoal: (item: string, rate: number) => void
  setRecipeOverride: (item: string, recipeName: string) => void
  setMinerConfig: (item: string, config: MinerConfig) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  resetLayout: () => void
}

function recalculate(state: FactoryStore): Partial<FactoryStore> {
  const { goal, recipeOverrides, nodePositions, minerConfigs } = state
  if (!goal || !goal.item || goal.rate <= 0) return {}

  const result = resolveRecipeTree(goal.item, goal.rate, recipeOverrides, minerConfigs)

  const { nodes, edges } = buildFlowGraph(
    result,
    {
      onMinerConfigChange: (item, config) =>
        useFactoryStore.getState().setMinerConfig(item, config),
      onRecipeChange: (item, recipeName) =>
        useFactoryStore.getState().setRecipeOverride(item, recipeName),
    },
    nodePositions,
    minerConfigs,
  )

  return { factoryResult: result, nodes, edges }
}

export const useFactoryStore = create<FactoryStore>((set, get) => ({
  goal: null,
  recipeOverrides: new Map(),
  minerConfigs: new Map(),
  factoryResult: null,
  nodes: [],
  edges: [],
  nodePositions: new Map(),

  setGoal: (item, rate) => {
    const next: Partial<FactoryStore> = {
      goal: { item, rate },
      nodePositions: new Map(),
    }
    set(state => ({ ...next, ...recalculate({ ...state, ...next } as FactoryStore) }))
  },

  setRecipeOverride: (item, recipeName) => {
    const recipeOverrides = new Map(get().recipeOverrides)
    recipeOverrides.set(item, recipeName)
    set(state => ({
      recipeOverrides,
      nodePositions: new Map(),
      ...recalculate({ ...state, recipeOverrides }),
    }))
  },

  setMinerConfig: (item, config) => {
    const minerConfigs = new Map(get().minerConfigs)
    minerConfigs.set(item, config)
    // Full recalculate + position reset: miner output changes → machine counts change
    set(state => ({
      minerConfigs,
      nodePositions: new Map(),
      ...recalculate({ ...state, minerConfigs, nodePositions: new Map() }),
    }))
  },

  onNodesChange: changes => {
    const nodes = applyNodeChanges(changes, get().nodes)
    const nodePositions = new Map(get().nodePositions)
    for (const c of changes) {
      if (c.type === 'position' && c.position) {
        nodePositions.set(c.id, c.position)
      }
    }
    set({ nodes, nodePositions })
  },

  onEdgesChange: changes => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },

  resetLayout: () => {
    set(state => ({
      nodePositions: new Map(),
      ...recalculate({ ...state, nodePositions: new Map() }),
    }))
  },
}))

export function getAvailableRecipes(item: string) {
  return getRecipesForItem(item)
}

export { machineNodeId }
