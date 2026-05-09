export type MinerMk = 'Mk.1' | 'Mk.2' | 'Mk.3'
export type OrePurity = '低純度' | '中純度' | '高純度'

export interface MinerConfig {
  mk: MinerMk
  purity: OrePurity
  clockSpeed: number   // 1–250 %
  sommersloop: number  // 0–4 slots
}

/** 採鉱機の産出量 (個/min) — 100%クロック・ソマースループ0の基本値 */
export const MINER_RATES: Record<MinerMk, Record<OrePurity, number>> = {
  'Mk.1': { '低純度': 30,  '中純度': 60,  '高純度': 120 },
  'Mk.2': { '低純度': 60,  '中純度': 120, '高純度': 240 },
  'Mk.3': { '低純度': 120, '中純度': 240, '高純度': 480 },
}

export const MINER_MK_OPTIONS: MinerMk[] = ['Mk.1', 'Mk.2', 'Mk.3']
export const PURITY_OPTIONS: OrePurity[] = ['低純度', '中純度', '高純度']
export const SOMMERSLOOP_OPTIONS: number[] = [0, 1, 2, 3, 4]

export const DEFAULT_MINER_CONFIG: MinerConfig = {
  mk: 'Mk.1',
  purity: '中純度',
  clockSpeed: 100,
  sommersloop: 0,
}

/** オーバークロック・ソマースループを含む産出量 */
export function getMinerRate(config: MinerConfig): number {
  const base = MINER_RATES[config.mk][config.purity]
  return base * (config.clockSpeed / 100) * (1 + config.sommersloop)
}

