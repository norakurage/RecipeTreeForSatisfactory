export const MACHINE_META: Record<string, { icon: string; color: string; bg: string }> = {
  製錬炉:           { icon: '🔥', color: '#f97316', bg: '#431407' },
  製作機:           { icon: '⚙️', color: '#3b82f6', bg: '#172554' },
  組立機:           { icon: '🔧', color: '#a855f7', bg: '#2e1065' },
  製造機:           { icon: '🏭', color: '#eab308', bg: '#422006' },
  精製機:           { icon: '🛢️', color: '#06b6d4', bg: '#083344' },
  鋳造炉:           { icon: '⚒️', color: '#ef4444', bg: '#450a0a' },
  混合機:           { icon: '🌀', color: '#22c55e', bg: '#052e16' },
  充填機:           { icon: '📦', color: '#ec4899', bg: '#500724' },
  粒子加速器:       { icon: '⚛️', color: '#6366f1', bg: '#1e1b4b' },
  量子エンコーダー: { icon: '🔬', color: '#8b5cf6', bg: '#2e1065' },
  変換機:           { icon: '♻️', color: '#14b8a6', bg: '#042f2e' },
}

export const DEFAULT_META = { icon: '⚙️', color: '#64748b', bg: '#0f172a' }

export function getMachineMeta(name: string) {
  return MACHINE_META[name] ?? DEFAULT_META
}
