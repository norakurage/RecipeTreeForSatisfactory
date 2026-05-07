import type { RawBuilding, RawRecipe } from '../types'

/** Base output rate (items/min) for one machine at 100% clock */
export function getBaseOutputPerMin(recipe: RawRecipe, item: string): number {
  const out = recipe.outputs.find(o => o.item === item)
  if (!out) return 0
  return (out.count / recipe.duration) * 60
}

/** Number of machines needed (may be fractional) */
export function getMachinesNeeded(
  targetRate: number,
  baseOutputPerMin: number,
  clockSpeed: number,
): number {
  const effective = baseOutputPerMin * (clockSpeed / 100)
  if (effective <= 0) return 0
  return targetRate / effective
}

/**
 * Power draw for a single machine at the given clock speed.
 * Formula: P = basePower * (clock/100) ^ powerExponent
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

/**
 * Total power for a fractional number of machines.
 * Full machines run at clockSpeed; the fractional last machine
 * runs at a proportionally reduced clock speed to hit the exact rate.
 */
export function getTotalPower(
  building: RawBuilding,
  machinesNeeded: number,
  clockSpeed: number,
): number {
  if (machinesNeeded <= 0) return 0
  const full = Math.floor(machinesNeeded)
  const frac = machinesNeeded - full
  let total = full * getPowerPerMachine(building, clockSpeed)
  if (frac > 0.0001) {
    total += getPowerPerMachine(building, clockSpeed * frac)
  }
  return total
}
