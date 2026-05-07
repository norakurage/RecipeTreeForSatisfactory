import type { RawRecipe, RawBuilding } from '../types'
import recipesJson from './satisfactory_recipes.json'
import buildingsJson from './satisfactory_buildings.json'

export const MACHINE_STATIONS = new Set([
  '製作機', '精製機', '組立機', '製造機', '製錬炉', '鋳造炉',
  '混合機', '充填機', '粒子加速器', '量子エンコーダー', '変換機',
])

// Only machine-producible recipes with valid inputs/outputs
export const allRecipes: RawRecipe[] = (recipesJson as RawRecipe[]).filter(
  r =>
    r.name !== 'N/A' &&
    r.inputs.length > 0 &&
    r.outputs.length > 0 &&
    r.craft_station.some(s => MACHINE_STATIONS.has(s)),
)

export const allBuildings: Record<string, RawBuilding> =
  buildingsJson as Record<string, RawBuilding>

// Sorted list of all producible item names
export const allItems: string[] = [
  ...new Set(allRecipes.flatMap(r => r.outputs.map(o => o.item))),
].sort()

// Fast lookup: item → list of recipes that produce it
export const recipesByOutput = new Map<string, RawRecipe[]>()
for (const recipe of allRecipes) {
  for (const output of recipe.outputs) {
    if (!recipesByOutput.has(output.item)) {
      recipesByOutput.set(output.item, [])
    }
    recipesByOutput.get(output.item)!.push(recipe)
  }
}

export function getRecipesForItem(item: string): RawRecipe[] {
  return recipesByOutput.get(item) ?? []
}

export function getDefaultRecipe(
  item: string,
  overrides: Map<string, string>,
): RawRecipe | null {
  const candidates = getRecipesForItem(item)
  if (!candidates.length) return null
  const overrideName = overrides.get(item)
  if (overrideName) {
    return candidates.find(r => r.name === overrideName) ?? candidates[0]
  }
  // Prefer non-alternate (don't start with 代替)
  return candidates.find(r => !r.name.startsWith('代替')) ?? candidates[0]
}
