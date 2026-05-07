import { memo, useCallback } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { RawNodeData } from '../utils/layout'
import {
  MINER_MK_OPTIONS,
  PURITY_OPTIONS,
  getMinerRate,
  getMinersNeeded,
} from '../data/miners'
import type { MinerMk, OrePurity } from '../data/miners'

const PURITY_COLOR: Record<OrePurity, string> = {
  '不純':   '#f87171',
  '普通':   '#94a3b8',
  '高純度': '#34d399',
}

export const RawMaterialNode = memo(function RawMaterialNode({
  data,
  selected,
}: NodeProps) {
  const { item, rate, minerConfig, onMinerConfigChange } = data as RawNodeData

  const minerRate = getMinerRate(minerConfig)
  const minersNeeded = getMinersNeeded(rate, minerConfig)

  const handleMkChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onMinerConfigChange(item, { ...minerConfig, mk: e.target.value as MinerMk })
    },
    [item, minerConfig, onMinerConfigChange],
  )

  const handlePurityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onMinerConfigChange(item, {
        ...minerConfig,
        purity: e.target.value as OrePurity,
      })
    },
    [item, minerConfig, onMinerConfigChange],
  )

  return (
    <div
      style={{
        width: 210,
        background: '#0f172a',
        border: `2px solid ${selected ? '#f1f5f9' : '#475569'}`,
        borderRadius: 8,
        fontSize: 12,
        color: '#cbd5e1',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#1e293b',
          borderRadius: '6px 6px 0 0',
          padding: '7px 10px 5px',
          borderBottom: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 14 }}>🪨</span>
          <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
            採掘素材
          </span>
        </div>
        <div
          style={{
            color: '#e2e8f0',
            fontWeight: 700,
            fontSize: 12,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item}
        </div>
        <div style={{ color: '#60a5fa', fontSize: 11, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
          必要: {rate.toFixed(1)}/min
        </div>
      </div>

      {/* Miner selector */}
      <div
        style={{
          padding: '6px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div
          style={{
            color: '#f59e0b',
            fontSize: 10,
            fontWeight: 600,
            marginBottom: 1,
          }}
        >
          ⛏️ 採鉱機設定
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {/* Mk selector */}
          <select
            value={minerConfig.mk}
            onChange={handleMkChange}
            className="nodrag"
            style={selectStyle}
          >
            {MINER_MK_OPTIONS.map(mk => (
              <option key={mk} value={mk}>
                {mk}
              </option>
            ))}
          </select>

          {/* Purity selector */}
          <select
            value={minerConfig.purity}
            onChange={handlePurityChange}
            className="nodrag"
            style={{
              ...selectStyle,
              color: PURITY_COLOR[minerConfig.purity],
            }}
          >
            {PURITY_OPTIONS.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mining result */}
      <div
        style={{
          padding: '6px 10px',
          background: '#0d1b2a',
          borderRadius: '0 0 6px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#64748b', fontSize: 10 }}>
            1台の産出
          </span>
          <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
            {minerRate.toFixed(0)}/min
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#64748b', fontSize: 10 }}>必要台数</span>
          <span
            style={{ color: '#fbbf24', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
          >
            ×{Math.ceil(minersNeeded)}台{' '}
            <span style={{ color: '#475569', fontSize: 10, fontWeight: 400 }}>
              ({minersNeeded.toFixed(2)})
            </span>
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
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 4,
  color: '#e2e8f0',
  fontSize: 11,
  padding: '3px 4px',
  cursor: 'pointer',
  outline: 'none',
}
