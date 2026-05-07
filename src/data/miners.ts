export type MinerMk = 'Mk.1' | 'Mk.2' | 'Mk.3'
export type OrePurity = '不純' | '普通' | '高純度'

export interface MinerConfig {
  mk: MinerMk
  purity: OrePurity
}

/** 採鉱機の産出量 (個/min) */
export const MINER_RATES: Record<MinerMk, Record<OrePurity, number>> = {
  'Mk.1': { '不純': 30,  '普通': 60,  '高純度': 120 },
  'Mk.2': { '不純': 60,  '普通': 120, '高純度': 240 },
  'Mk.3': { '不純': 120, '普通': 240, '高純度': 480 },
}

export const MINER_MK_OPTIONS: MinerMk[] = ['Mk.1', 'Mk.2', 'Mk.3']
export const PURITY_OPTIONS: OrePurity[] = ['不純', '普通', '高純度']

export const DEFAULT_MINER_CONFIG: MinerConfig = { mk: 'Mk.1', purity: '普通' }

export function getMinerRate(config: MinerConfig): number {
  return MINER_RATES[config.mk][config.purity]
}

export function getMinersNeeded(targetRate: number, config: MinerConfig): number {
  const rate = getMinerRate(config)
  if (rate <= 0) return 0
  return targetRate / rate
}
