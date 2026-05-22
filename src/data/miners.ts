export type MinerMk = 'Mk.1' | 'Mk.2' | 'Mk.3'
export type OrePurity = '低純度' | '中純度' | '高純度'

export interface MinerConfig {
  mk: MinerMk
  purity: OrePurity
  clockSpeed: number   // 1–250 %
  sommersloop: number  // 0 〜 MINER_SOMERSLOOP_SLOTS[mk]
  customRate?: number  // set to override computed rate with a direct value
}

/** 採鉱機の産出量 (個/min) — 100%クロック・ソマースループ0の基本値 */
export const MINER_RATES: Record<MinerMk, Record<OrePurity, number>> = {
  'Mk.1': { '低純度': 30,  '中純度': 60,  '高純度': 120 },
  'Mk.2': { '低純度': 60,  '中純度': 120, '高純度': 240 },
  'Mk.3': { '低純度': 120, '中純度': 240, '高純度': 480 },
}

/** 採鉱機Mkごとのサマースループスロット数。最大投入で産出量2倍 */
export const MINER_SOMERSLOOP_SLOTS: Record<MinerMk, number> = {
  'Mk.1': 1,
  'Mk.2': 2,
  'Mk.3': 4,
}

export const MINER_MK_OPTIONS: MinerMk[] = ['Mk.1', 'Mk.2', 'Mk.3']
export const PURITY_OPTIONS: OrePurity[] = ['低純度', '中純度', '高純度']

/** Mkに応じた投入可能なソマースループ数の選択肢 (0〜スロット数) */
export function getSommersloopOptions(mk: MinerMk): number[] {
  const slots = MINER_SOMERSLOOP_SLOTS[mk]
  return Array.from({ length: slots + 1 }, (_, i) => i)
}

export const DEFAULT_MINER_CONFIG: MinerConfig = {
  mk: 'Mk.1',
  purity: '中純度',
  clockSpeed: 100,
  sommersloop: 0,
}

/** オーバークロック・ソマースループを含む産出量
 * customRate が設定されている場合はそれを直接使用する
 * 速度倍率 = 1 + (投入数 / スロット数)  →  最大投入で2倍
 */
export function getMinerRate(config: MinerConfig): number {
  if (config.customRate !== undefined) return config.customRate
  const base = MINER_RATES[config.mk][config.purity]
  const slots = MINER_SOMERSLOOP_SLOTS[config.mk]
  return base * (config.clockSpeed / 100) * (1 + config.sommersloop / slots)
}

