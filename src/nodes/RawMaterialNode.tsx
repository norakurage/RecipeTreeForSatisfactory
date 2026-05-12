import { memo, useCallback } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { RawNodeData } from '../utils/layout'
import {
  MINER_MK_OPTIONS,
  PURITY_OPTIONS,
  SOMMERSLOOP_OPTIONS,
  getMinerRate,
} from '../data/miners'
import type { MinerMk, OrePurity } from '../data/miners'
import { getMachineForRecipe, RAW_OVERRIDE } from '../data/loader'

const PURITY_COLOR: Record<OrePurity, string> = {
  '低純度': '#f87171',
  '中純度': '#94a3b8',
  '高純度': '#34d399',
}

export const RawMaterialNode = memo(function RawMaterialNode({
  data,
  selected,
}: NodeProps) {
  const {
    item,
    minerConfig,
    onMinerConfigChange,
    availableRecipes,
    onRecipeChange,
  } = data as RawNodeData

  const minerRate = getMinerRate(minerConfig)

  const handleMkChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onMinerConfigChange(item, { ...minerConfig, mk: e.target.value as MinerMk })
    },
    [item, minerConfig, onMinerConfigChange],
  )

  const handlePurityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onMinerConfigChange(item, { ...minerConfig, purity: e.target.value as OrePurity })
    },
    [item, minerConfig, onMinerConfigChange],
  )

  const handleClockChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Math.max(1, Math.min(250, Number(e.target.value)))
      onMinerConfigChange(item, { ...minerConfig, clockSpeed: v })
    },
    [item, minerConfig, onMinerConfigChange],
  )

  const handleSommersloopChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onMinerConfigChange(item, { ...minerConfig, sommersloop: Number(e.target.value) })
    },
    [item, minerConfig, onMinerConfigChange],
  )

  const handleRecipeSwitch = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onRecipeChange(item, e.target.value)
    },
    [item, onRecipeChange],
  )

  const hasManufacturingRecipes = availableRecipes.length > 0


  return (
    <div
      style={{
        width: 220,
        background: '#0f172a',
        border: `2px solid ${selected ? '#f1f5f9' : '#475569'}`,
        borderRadius: 8,
        fontSize: 12,
        color: '#cbd5e1',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        fontFamily: 'sans-serif',
      }}
    >
      {/* ── Settings header ── */}
      <div
        style={{
          background: '#1e293b',
          borderRadius: '6px 6px 0 0',
          padding: '7px 10px 8px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        {/* Item identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 14 }}>🪨</span>
          <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>採掘素材</span>
          {hasManufacturingRecipes && (
            <span
              style={{
                marginLeft: 'auto',
                background: '#1e3a5f',
                color: '#60a5fa',
                fontSize: 9,
                padding: '1px 5px',
                borderRadius: 9,
              }}
            >
              製造レシピあり
            </span>
          )}
        </div>
        <div
          style={{
            color: '#e2e8f0',
            fontWeight: 700,
            fontSize: 13,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item}
        </div>

        {/* Recipe switch */}
        {hasManufacturingRecipes && (
          <select
            value={RAW_OVERRIDE}
            onChange={handleRecipeSwitch}
            className="nodrag"
            style={{ ...selectStyle, color: '#93c5fd', borderColor: '#1e3a5f' }}
          >
            <option value={RAW_OVERRIDE}>🪨 採掘 (現在)</option>
            {availableRecipes.map(r => {
              const machine = getMachineForRecipe(r)
              const isAlt = r.name.startsWith('代替')
              return (
                <option key={r.name} value={r.name}>
                  {isAlt ? '★ ' : '⚙️ '}{r.name}
                  {machine ? ` [${machine}]` : ''}
                </option>
              )
            })}
          </select>
        )}

        {/* Mk + Purity */}
        <div style={{ display: 'flex', gap: 5 }}>
          <select value={minerConfig.mk} onChange={handleMkChange} className="nodrag" style={selectStyle}>
            {MINER_MK_OPTIONS.map(mk => (
              <option key={mk} value={mk}>{mk}</option>
            ))}
          </select>
          <select
            value={minerConfig.purity}
            onChange={handlePurityChange}
            className="nodrag"
            style={{ ...selectStyle, color: PURITY_COLOR[minerConfig.purity] }}
          >
            {PURITY_OPTIONS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Clock speed + Sommersloop */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ color: '#facc15', fontSize: 11 }}>⚡</span>
          <input
            type="number"
            min={1}
            max={250}
            step={5}
            value={minerConfig.clockSpeed}
            onChange={handleClockChange}
            className="nodrag"
            style={{
              width: 52,
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 4,
              color: '#facc15',
              padding: '2px 4px',
              fontSize: 11,
              textAlign: 'right',
              outline: 'none',
            }}
          />
          <span style={{ color: '#475569', fontSize: 10 }}>%</span>
          <span style={{ color: '#a78bfa', fontSize: 11, marginLeft: 4 }}>🔮</span>
          <select
            value={minerConfig.sommersloop}
            onChange={handleSommersloopChange}
            className="nodrag"
            style={{ ...selectStyle, flex: 1, color: '#a78bfa' }}
          >
            {SOMMERSLOOP_OPTIONS.map(n => (
              <option key={n} value={n}>×{n + 1}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Output section ── */}
      <div
        style={{
          padding: '6px 10px',
          background: '#0d1b2a',
          borderRadius: '0 0 6px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#64748b', fontSize: 10 }}>1台の産出</span>
          <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
            {minerRate.toFixed(0)}/min
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id={`out-${item}`}
        style={{
          background: '#6b7280',
          width: 10,
          height: 10,
          border: '2px solid #374151',
        }}
      />
    </div>
  )
})

const selectStyle: React.CSSProperties = {
  flex: 1,
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 4,
  color: '#e2e8f0',
  fontSize: 11,
  padding: '3px 4px',
  cursor: 'pointer',
  outline: 'none',
}
