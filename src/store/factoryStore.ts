import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react'
import type { FactoryResult, ProductionGoal } from '../types'
import { resolveRecipeTree } from '../logic/resolveRecipeTree'
import { buildFlowGraph } from '../utils/layout'
import { getRecipesForItem } from '../data/loader'

interface FactoryStore {
  // ── User inputs ────────────────────────────────────────────────────────────
  goal: ProductionGoal | null
  recipeOverrides: Map<string, string>   // itemName → recipeName
  clockOverrides: Map<string, number>    // stepId → clockSpeed %

  // ── Computed ───────────────────────────────────────────────────────────────
  factoryResult: FactoryResult | null

  // ── React Flow state ───────────────────────────────────────────────────────
  nodes: Node[]
  edges: Edge[]
  nodePositions: Map<string, { x: number; y: number }>

  // ── Actions ────────────────────────────────────────────────────────────────
  setGoal: (item: string, rate: number) => void
  setRecipeOverride: (item: string, recipeName: string) => void
  setClockOverride: (stepId: string, clock: number) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  resetLayout: () => void
}

function recalculate(state: FactoryStore): Partial<FactoryStore> {
  const { goal, recipeOverrides, clockOverrides, nodePositions } = state
  if (!goal || !goal.item || goal.rate <= 0) return {}

  const result = resolveRecipeTree(
    goal.item,
    goal.rate,
    recipeOverrides,
    clockOverrides,
  )

  const { nodes, edges } = buildFlowGraph(
    result,
    (stepId, clock) => useFactoryStore.getState().setClockOverride(stepId, clock),
    nodePositions,
  )

  return { factoryResult: result, nodes, edges }
}

export const useFactoryStore = create<FactoryStore>((set, get) => ({
  goal: null,
  recipeOverrides: new Map(),
  clockOverrides: new Map(),
  factoryResult: null,
  nodes: [],
  edges: [],
  nodePositions: new Map(),

  setGoal: (item, rate) => {
    const next: Partial<FactoryStore> = {
      goal: { item, rate },
      // Reset overrides when goal changes
      clockOverrides: new Map(),
      nodePositions: new Map(),
    }
    set(state => ({ ...next, ...recalculate({ ...state, ...next } as FactoryStore) }))
  },

  setRecipeOverride: (item, recipeName) => {
    const recipeOverrides = new Map(get().recipeOverrides)
    recipeOverrides.set(item, recipeName)
    set(state => ({
      recipeOverrides,
      nodePositions: new Map(), // reset positions on topology change
      ...recalculate({ ...state, recipeOverrides }),
    }))
  },

  setClockOverride: (stepId, clock) => {
    const clockOverrides = new Map(get().clockOverrides)
    clockOverrides.set(stepId, clock)
    // Clock changes only affect machine count + power, not positions
    set(state => ({
      clockOverrides,
      ...recalculate({ ...state, clockOverrides }),
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

/** Convenience: available recipes for an item, respecting current overrides */
export function getAvailableRecipes(item: string) {
  return getRecipesForItem(item)
}
