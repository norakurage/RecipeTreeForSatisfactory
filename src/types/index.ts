// ─── Core domain types ──────────────────────────────────────────────────────

export type ItemId = string;

export interface Ingredient {
  item: ItemId;
  count: number;
}

export interface RawRecipe {
  name: string;
  inputs: Ingredient[];
  outputs: Ingredient[];
  duration: number;
  craft_station: string[];
}

export interface RawBuilding {
  id: string;
  name: string;
  power_consumption: number;
  power_exponent: number;
  manufacturing_speed: number;
  can_overclock: boolean;
  boost_power_exponent: number;
  base_boost: number;
  somersloop_slots: number;
  max_boost_multiplier: number;
}

// ─── Factory calculation result types ────────────────────────────────────────

export interface ProductionStep {
  id: string;              // `${itemName}||${recipeName}`
  itemName: ItemId;
  recipe: RawRecipe;
  totalRate: number;       // items/min demanded (all machines combined)
  machinesNeeded: number;  // fractional
  instanceCount: number;   // ceil(machinesNeeded) — physical machine cards
  clockSpeed: number;      // uniform per-machine clock = machinesNeeded/instanceCount * 100
  building: RawBuilding | null;
  machineName: string;
  inputRates: { item: ItemId; rate: number }[];   // total across all machines
  outputRates: { item: ItemId; rate: number }[];  // total across all machines
  totalPower: number;      // MW
  isAlternate: boolean;
}

export interface FactoryResult {
  steps: Map<string, ProductionStep>;
  rawMaterials: Map<ItemId, number>;   // item → rate/min
  totalPower: number;                  // MW
  totalMachines: Record<string, number>; // machineName → fractional count
}

export interface ProductionGoal {
  item: ItemId;
  rate: number;
}
