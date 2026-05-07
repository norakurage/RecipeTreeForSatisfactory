import type { FactoryResult, ProductionStep } from '../types'
import {
  allBuildings,
  getDefaultRecipe,
  MACHINE_STATIONS,
} from '../data/loader'
import {
  getBaseOutputPerMin,
  getMachinesNeeded,
  getTotalPower,
} from './machineMath'

/**
 * Incremental demand aggregation algorithm:
 *
 * addDemand(item, rate):
 *   1. Add `rate` to itemDemands[item]
 *   2. If first visit  → recurse for all inputs at ratio * rate
 *   3. If revisit      → recurse only for the DELTA so we don't double-count
 *
 * Input rates are ratio-based (independent of clockSpeed), so total input
 * for an item is simply: demand(item) * (inputCount / outputCount).
 * ClockSpeed only affects machinesNeeded and power.
 */
export function resolveRecipeTree(
  targetItem: string,
  targetRate: number,
  recipeOverrides: Map<string, string>,
  clockOverrides: Map<string, number>,
): FactoryResult {
  // ── Phase 1: collect total rate demanded for every item ──────────────────
  const itemDemands = new Map<string, number>()

  function addDemand(item: string, rate: number, depth = 0): void {
    if (rate < 0.0001 || depth > 30) return

    const recipe = getDefaultRecipe(item, recipeOverrides)

    if (!recipe) {
      // Raw material — just accumulate
      itemDemands.set(item, (itemDemands.get(item) ?? 0) + rate)
      return
    }

    const prev = itemDemands.get(item) ?? 0
    itemDemands.set(item, prev + rate)

    const primaryOut = recipe.outputs.find(o => o.item === item)!

    for (const inp of recipe.inputs) {
      // ratio of input to primary output (clockSpeed-independent)
      const ratio = inp.count / primaryOut.count
      addDemand(inp.item, rate * ratio, depth + 1)
    }
  }

  addDemand(targetItem, targetRate)

  // ── Phase 2: build ProductionStep objects from aggregated demands ─────────
  const steps = new Map<string, ProductionStep>()
  const rawMaterials = new Map<string, number>()

  for (const [item, totalRate] of itemDemands) {
    const recipe = getDefaultRecipe(item, recipeOverrides)

    if (!recipe) {
      rawMaterials.set(item, totalRate)
      continue
    }

    const stepId = `${item}||${recipe.name}`
    const clockSpeed = clockOverrides.get(stepId) ?? 100

    const machineName =
      recipe.craft_station.find(s => MACHINE_STATIONS.has(s)) ?? ''
    const building = allBuildings[machineName] ?? null

    const baseOut = getBaseOutputPerMin(recipe, item)
    const machinesNeeded = getMachinesNeeded(totalRate, baseOut, clockSpeed)

    const primaryOut = recipe.outputs.find(o => o.item === item)!

    const inputRates = recipe.inputs.map(inp => ({
      item: inp.item,
      rate: totalRate * (inp.count / primaryOut.count),
    }))

    const outputRates = recipe.outputs.map(out => ({
      item: out.item,
      rate: totalRate * (out.count / primaryOut.count),
    }))

    const totalPower = building
      ? getTotalPower(building, machinesNeeded, clockSpeed)
      : 0

    steps.set(stepId, {
      id: stepId,
      itemName: item,
      recipe,
      totalRate,
      machinesNeeded,
      clockSpeed,
      building,
      machineName,
      inputRates,
      outputRates,
      totalPower,
      isAlternate: recipe.name.startsWith('代替'),
    })
  }

  // ── Summary stats ────────────────────────────────────────────────────────
  let totalPower = 0
  const totalMachines: Record<string, number> = {}

  for (const step of steps.values()) {
    totalPower += step.totalPower
    if (step.machineName) {
      totalMachines[step.machineName] =
        (totalMachines[step.machineName] ?? 0) + step.machinesNeeded
    }
  }

  return { steps, rawMaterials, totalPower, totalMachines }
}
