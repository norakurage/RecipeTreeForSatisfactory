import type { RawBuilding, RawRecipe } from '../types'

/** Base output rate (items/min) for one machine at 100% clock */
export function getBaseOutputPerMin(recipe: RawRecipe, item: string): number {
  const out = recipe.outputs.find(o => o.item === item)
  if (!out) return 0
  return (out.count / recipe.duration) * 60
}

/** Fractional machines needed at 100% clock */
export function getMachinesNeeded(
  targetRate: number,
  baseOutputPerMin: number,
): number {
  if (baseOutputPerMin <= 0) return 0
  return targetRate / baseOutputPerMin
}

/** Physical machine count = ceil(machinesNeeded) */
export function getInstanceCount(machinesNeeded: number): number {
  return Math.max(1, Math.ceil(machinesNeeded))
}

/** Uniform clock per machine so total output = targetRate with no excess */
export function getPerMachineClock(machinesNeeded: number): number {
  const n = getInstanceCount(machinesNeeded)
  return (machinesNeeded / n) * 100
}

/**
 * Power for a single machine at the given clock speed.
 * P = basePower * (clock/100) ^ powerExponent
 */
export function getPowerPerMachine(
  building: RawBuilding,
  clockSpeed: number,
): number {
  return (
    building.power_consumption *
    Math.pow(clockSpeed / 100, building.power_exponent)
  )
}

/** Total power for all instances running at uniform clock */
export function getTotalPower(
  building: RawBuilding,
  machinesNeeded: number,
): number {
  if (machinesNeeded <= 0) return 0
  const n = getInstanceCount(machinesNeeded)
  const clock = getPerMachineClock(machinesNeeded)
  return n * getPowerPerMachine(building, clock)
}
