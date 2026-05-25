import type { FactoryResult, ProductionStep } from '../types'
import {
  allBuildings,
  getDefaultRecipe,
  INFINITE_RESOURCES,
  MACHINE_STATIONS,
} from '../data/loader'
import {
  getBaseOutputPerMin,
  getMachinesNeeded,
  getInstanceCount,
  getPerMachineClock,
  getTotalPower,
} from './machineMath'
import { getMinerRate, DEFAULT_MINER_CONFIG } from '../data/miners'
import type { MinerConfig } from '../data/miners'

/**
 * Two-pass supply-aware calculation:
 *
 * Pass 1 (demand): collect raw material needs at targetRate.
 * Scale step: for each raw material, scale = minerRate / demanded.
 *   effectiveScale = min(scale) — limited by the tightest bottleneck miner.
 *   effectiveTarget = targetRate × effectiveScale  (always ≤ targetRate).
 * Pass 2 (final): collect all demands at effectiveTarget; build steps.
 *
 * Result: production machines scale to fully utilise the actual integer-miner output.
 * Changing miner clock/sommersloop changes minerRate → changes scale → changes machine counts.
 */
export function resolveRecipeTree(
  targetItem: string,
  targetRate: number,
  recipeOverrides: Map<string, string>,
  minerConfigs: Map<string, MinerConfig>,
): FactoryResult {
  // ── Shared addDemand helper ───────────────────────────────────────────────
  function buildDemands(rootRate: number): Map<string, number> {
    const demands = new Map<string, number>()

    function addDemand(item: string, rate: number, depth = 0): void {
      if (rate < 0.0001 || depth > 30) return

      const recipe = getDefaultRecipe(item, recipeOverrides)

      if (!recipe) {
        demands.set(item, (demands.get(item) ?? 0) + rate)
        return
      }

      const prev = demands.get(item) ?? 0
      demands.set(item, prev + rate)

      const primaryOut = recipe.outputs.find(o => o.item === item)!
      for (const inp of recipe.inputs) {
        addDemand(inp.item, rate * (inp.count / primaryOut.count), depth + 1)
      }
    }

    addDemand(targetItem, rootRate)
    return demands
  }

  // ── Pass 1: demand at targetRate → find raw material needs ───────────────
  const pass1 = buildDemands(targetRate)

  // ── Scale step: compute effective target from integer miner output ────────
  let minScale = Infinity
  for (const [item, demanded] of pass1) {
    if (getDefaultRecipe(item, recipeOverrides) !== null) continue // skip production items
    if (INFINITE_RESOURCES.has(item)) continue // treat as unlimited, never bottleneck

    if (!minerConfigs.has(item)) continue // unconfigured → treat as unlimited
    const config = minerConfigs.get(item)!
    const mRate = getMinerRate(config)
    if (mRate <= 0 || demanded <= 0) continue

    const scale = mRate / demanded
    if (scale < minScale) minScale = scale
  }
  if (!isFinite(minScale)) minScale = 1

  const effectiveTarget = targetRate * minScale

  // ── Pass 2: final demand at effectiveTarget ───────────────────────────────
  const itemDemands = buildDemands(effectiveTarget)

  // ── Build ProductionStep objects ──────────────────────────────────────────
  const steps = new Map<string, ProductionStep>()
  const rawMaterials = new Map<string, number>()

  for (const [item, totalRate] of itemDemands) {
    const recipe = getDefaultRecipe(item, recipeOverrides)

    if (!recipe) {
      rawMaterials.set(item, totalRate)
      continue
    }

    const stepId = `${item}||${recipe.name}`
    const machineName =
      recipe.craft_station.find(s => MACHINE_STATIONS.has(s)) ?? ''
    const building = allBuildings[machineName] ?? null

    const baseOut = getBaseOutputPerMin(recipe, item)
    const machinesNeeded = getMachinesNeeded(totalRate, baseOut)
    const instanceCount = getInstanceCount(machinesNeeded)
    const clockSpeed = getPerMachineClock(machinesNeeded)

    const primaryOut = recipe.outputs.find(o => o.item === item)!

    const inputRates = recipe.inputs.map(inp => ({
      item: inp.item,
      rate: totalRate * (inp.count / primaryOut.count),
    }))
    const outputRates = recipe.outputs.map(out => ({
      item: out.item,
      rate: totalRate * (out.count / primaryOut.count),
    }))

    const totalPower = building ? getTotalPower(building, machinesNeeded) : 0

    steps.set(stepId, {
      id: stepId,
      itemName: item,
      recipe,
      totalRate,
      machinesNeeded,
      instanceCount,
      clockSpeed,
      building,
      machineName,
      inputRates,
      outputRates,
      totalPower,
      isAlternate: recipe.name.startsWith('代替'),
    })
  }

  // ── Summary stats ─────────────────────────────────────────────────────────
  let totalPower = 0
  const totalMachines: Record<string, number> = {}
  for (const step of steps.values()) {
    totalPower += step.totalPower
    if (step.machineName) {
      totalMachines[step.machineName] =
        (totalMachines[step.machineName] ?? 0) + step.instanceCount
    }
  }

  return { steps, rawMaterials, totalPower, totalMachines }
}
