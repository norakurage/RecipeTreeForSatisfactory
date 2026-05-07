import { useFactoryStore } from '../store/factoryStore'
import { getMinerRate, getMinersNeeded } from '../data/miners'
import type { OrePurity } from '../data/miners'

const PURITY_COLOR: Record<OrePurity, string> = {
  '不純': '#f87171', '普通': '#94a3b8', '高純度': '#34d399',
}

const MACHINE_ICONS: Record<string, string> = {
  製錬炉: '🔥', 製作機: '⚙️', 組立機: '🔧', 製造機: '🏭',
  精製機: '🛢️', 鋳造炉: '⚒️', 混合機: '🌀', 充填機: '📦',
  粒子加速器: '⚛️', 量子エンコーダー: '🔬', 変換機: '♻️',
}

export function RightSidebar() {
  const { factoryResult, resetLayout, minerConfigs } = useFactoryStore()

  if (!factoryResult) {
    return (
      <aside style={sidebarStyle}>
        <div style={{ padding: 16 }}>
          <SectionTitle>サマリー</SectionTitle>
          <p style={{ color: '#475569', fontSize: 12, marginTop: 8 }}>
            左のパネルでアイテムと生産量を設定してください。
          </p>
        </div>
      </aside>
    )
  }

  const { steps, rawMaterials, totalPower, totalMachines } = factoryResult

  const rawList = [...rawMaterials.entries()].sort((a, b) => b[1] - a[1])
  const machineList = Object.entries(totalMachines).sort((a, b) => b[1] - a[1])

  // Aggregate miners by Mk
  const minerByMk: Record<string, { count: number; items: { item: string; needed: number; purity: OrePurity }[] }> = {}
  for (const [item, rate] of rawMaterials) {
    const cfg = minerConfigs.get(item) ?? { mk: 'Mk.1' as const, purity: '普通' as const }
    const needed = getMinersNeeded(rate, cfg)
    if (!minerByMk[cfg.mk]) minerByMk[cfg.mk] = { count: 0, items: [] }
    minerByMk[cfg.mk].count += needed
    minerByMk[cfg.mk].items.push({ item, needed, purity: cfg.purity })
  }

  return (
    <aside style={sidebarStyle}>
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #1e3a5f',
          background: '#0a1520',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
          📊 生産サマリー
        </h2>
        <button
          onClick={resetLayout}
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 4,
            color: '#94a3b8',
            fontSize: 10,
            padding: '3px 7px',
            cursor: 'pointer',
          }}
          title="ノード配置をリセット"
        >
          ↺ 再配置
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* ── Power summary ── */}
        <section>
          <SectionTitle>消費電力</SectionTitle>
          <div
            style={{
              background: '#1e293b',
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 22 }}>⚡</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>
                {totalPower.toFixed(1)} MW
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>合計消費電力</div>
            </div>
          </div>
        </section>

        {/* ── Machine summary ── */}
        <section>
          <SectionTitle>設備台数</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {machineList.length === 0 && (
              <p style={{ color: '#475569', fontSize: 12 }}>なし</p>
            )}
            {machineList.map(([name, count]) => (
              <div key={name} style={rowStyle}>
                <span>
                  {MACHINE_ICONS[name] ?? '⚙️'}{' '}
                  <span style={{ color: '#cbd5e1' }}>{name}</span>
                </span>
                <span style={{ color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                  ×{Math.ceil(count)}{' '}
                  <span style={{ color: '#475569', fontSize: 10 }}>
                    ({count.toFixed(2)})
                  </span>
                </span>
              </div>
            ))}
            <div style={{ ...rowStyle, marginTop: 4, borderTop: '1px solid #1e293b', paddingTop: 6 }}>
              <span style={{ color: '#94a3b8', fontSize: 11 }}>工程数</span>
              <span style={{ color: '#94a3b8' }}>{steps.size}</span>
            </div>
          </div>
        </section>

        {/* ── Miner summary ── */}
        {Object.keys(minerByMk).length > 0 && (
          <section>
            <SectionTitle>採鉱機台数</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(['Mk.1', 'Mk.2', 'Mk.3'] as const)
                .filter(mk => minerByMk[mk])
                .map(mk => {
                  const { count, items } = minerByMk[mk]
                  return (
                    <div key={mk} style={{ background: '#1e293b', borderRadius: 6, overflow: 'hidden' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '5px 8px',
                          background: '#0f2236',
                          borderBottom: '1px solid #334155',
                        }}
                      >
                        <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                          ⛏️ 採鉱機 {mk}
                        </span>
                        <span style={{ color: '#fbbf24', fontVariantNumeric: 'tabular-nums' }}>
                          ×{Math.ceil(count)}台{' '}
                          <span style={{ color: '#475569', fontSize: 10 }}>
                            ({count.toFixed(2)})
                          </span>
                        </span>
                      </div>
                      {items.map(({ item, needed, purity }) => (
                        <div
                          key={item}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '3px 8px',
                            fontSize: 10,
                          }}
                        >
                          <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                            🪨 {item}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                            <span style={{ color: PURITY_COLOR[purity], fontSize: 9 }}>{purity}</span>
                            <span style={{ color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                              ×{Math.ceil(needed)}台
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
            </div>
          </section>
        )}

        {/* ── Raw materials ── */}
        <section>
          <SectionTitle>必要採掘量</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {rawList.length === 0 && (
              <p style={{ color: '#475569', fontSize: 12 }}>なし</p>
            )}
            {rawList.map(([item, rate]) => (
              <div key={item} style={rowStyle}>
                <span style={{ color: '#94a3b8', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  🪨 {item}
                </span>
                <span style={{ color: '#6b7280', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {rate.toFixed(1)}/min
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── All steps list ── */}
        <section>
          <SectionTitle>全工程一覧</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[...steps.values()].map(step => (
              <div
                key={step.id}
                style={{
                  background: '#1e293b',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 11,
                }}
              >
                <div style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: 2 }}>
                  {step.itemName}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#64748b',
                  }}
                >
                  <span>
                    {MACHINE_ICONS[step.machineName] ?? '⚙️'} ×{Math.ceil(step.machinesNeeded)}
                  </span>
                  <span style={{ color: '#fbbf24' }}>
                    {step.totalPower.toFixed(1)} MW
                  </span>
                  <span style={{ color: '#4ade80' }}>
                    {step.totalRate.toFixed(1)}/min
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: '0 0 6px',
        fontSize: 11,
        fontWeight: 700,
        color: '#f59e0b',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </h2>
  )
}

const sidebarStyle: React.CSSProperties = {
  width: 260,
  minWidth: 220,
  height: '100%',
  background: '#0d1b2a',
  borderLeft: '1px solid #1e3a5f',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 6px',
  background: '#1e293b',
  borderRadius: 4,
  fontSize: 11,
  color: '#94a3b8',
  gap: 6,
}
