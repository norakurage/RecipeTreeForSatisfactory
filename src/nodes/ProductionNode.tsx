import { memo, useCallback } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { ProdNodeData } from '../utils/layout'

// ── Machine metadata ──────────────────────────────────────────────────────────
const MACHINE_META: Record<
  string,
  { icon: string; color: string; bg: string }
> = {
  製錬炉:       { icon: '🔥', color: '#f97316', bg: '#431407' },
  製作機:       { icon: '⚙️', color: '#3b82f6', bg: '#172554' },
  組立機:       { icon: '🔧', color: '#a855f7', bg: '#2e1065' },
  製造機:       { icon: '🏭', color: '#eab308', bg: '#422006' },
  精製機:       { icon: '🛢️', color: '#06b6d4', bg: '#083344' },
  鋳造炉:       { icon: '⚒️', color: '#ef4444', bg: '#450a0a' },
  混合機:       { icon: '🌀', color: '#22c55e', bg: '#052e16' },
  充填機:       { icon: '📦', color: '#ec4899', bg: '#500724' },
  粒子加速器:   { icon: '⚛️', color: '#6366f1', bg: '#1e1b4b' },
  量子エンコーダー: { icon: '🔬', color: '#8b5cf6', bg: '#2e1065' },
  変換機:       { icon: '♻️', color: '#14b8a6', bg: '#042f2e' },
}
const DEFAULT_META = { icon: '⚙️', color: '#64748b', bg: '#0f172a' }

function getMeta(name: string) {
  return MACHINE_META[name] ?? DEFAULT_META
}

// ── Handle Y offset calculator ────────────────────────────────────────────────
const HEADER_H = 84
const CLOCK_H = 28
const SECTION_H = 20
const ROW_H = 22

function inputHandleTop(idx: number): number {
  return HEADER_H + CLOCK_H + SECTION_H + idx * ROW_H + ROW_H / 2
}
function outputHandleTop(nInputs: number, idx: number): number {
  return (
    HEADER_H +
    CLOCK_H +
    SECTION_H +
    nInputs * ROW_H +
    SECTION_H +
    idx * ROW_H +
    ROW_H / 2
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export const ProductionNode = memo(function ProductionNode({
  data,
  selected,
}: NodeProps) {
  const { step, onClockChange } = data as ProdNodeData
  const meta = getMeta(step.machineName)

  const handleClockChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Math.max(1, Math.min(250, Number(e.target.value)))
      onClockChange(step.id, v)
    },
    [step.id, onClockChange],
  )

  return (
    <div
      className="production-node"
      style={{
        width: 270,
        borderColor: selected ? '#f1f5f9' : meta.color,
        background: '#0f172a',
        borderWidth: 2,
        borderStyle: 'solid',
        borderRadius: 10,
        fontSize: 12,
        color: '#cbd5e1',
        boxShadow: selected
          ? `0 0 0 2px ${meta.color}`
          : `0 4px 16px rgba(0,0,0,0.6)`,
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: meta.bg,
          borderBottom: `1px solid ${meta.color}44`,
          padding: '8px 12px',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 2,
          }}
        >
          <span style={{ fontSize: 16 }}>{meta.icon}</span>
          <span style={{ fontWeight: 700, color: meta.color, fontSize: 13 }}>
            {step.machineName || '(未知)'}
          </span>
          {step.isAlternate && (
            <span
              style={{
                background: '#7c3aed',
                color: '#e9d5ff',
                fontSize: 9,
                padding: '1px 5px',
                borderRadius: 9,
              }}
            >
              代替
            </span>
          )}
        </div>
        <div style={{ color: '#94a3b8', fontSize: 11 }}>{step.recipe.name}</div>
      </div>

      {/* ── Clock speed ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderBottom: '1px solid #1e293b',
          background: '#0d1b2a',
        }}
      >
        <span style={{ color: '#facc15' }}>⚡</span>
        <input
          type="number"
          min={1}
          max={250}
          step={5}
          value={step.clockSpeed}
          onChange={handleClockChange}
          className="nodrag"
          style={{
            width: 52,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 4,
            color: '#facc15',
            padding: '1px 4px',
            fontSize: 11,
            textAlign: 'right',
          }}
        />
        <span style={{ color: '#64748b', fontSize: 10 }}>%</span>
        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 10 }}>
          {step.machinesNeeded.toFixed(2)} 台
        </span>
      </div>

      {/* ── Inputs ── */}
      <div style={{ padding: '4px 12px 2px' }}>
        <div
          style={{ color: '#60a5fa', fontSize: 10, marginBottom: 2, fontWeight: 600 }}
        >
          ▼ 入力
        </div>
        {step.inputRates.map(inp => (
          <div
            key={inp.item}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              height: ROW_H,
              alignItems: 'center',
              borderBottom: '1px solid #1e293b',
            }}
          >
            <span style={{ color: '#93c5fd', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {inp.item}
            </span>
            <span style={{ color: '#60a5fa', fontVariantNumeric: 'tabular-nums' }}>
              {inp.rate.toFixed(1)}/min
            </span>
          </div>
        ))}
      </div>

      {/* ── Outputs ── */}
      <div style={{ padding: '4px 12px 2px' }}>
        <div
          style={{ color: '#4ade80', fontSize: 10, marginBottom: 2, fontWeight: 600 }}
        >
          ▲ 出力
        </div>
        {step.outputRates.map(out => (
          <div
            key={out.item}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              height: ROW_H,
              alignItems: 'center',
              borderBottom: '1px solid #1e293b',
            }}
          >
            <span style={{ color: '#86efac', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {out.item}
            </span>
            <span style={{ color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>
              {out.rate.toFixed(1)}/min
            </span>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: '4px 12px',
          background: meta.bg,
          borderTop: `1px solid ${meta.color}44`,
          borderRadius: '0 0 8px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
        }}
      >
        <span style={{ color: '#94a3b8' }}>
          🏭 ×{Math.ceil(step.machinesNeeded)}台
          <span style={{ color: '#64748b', fontSize: 9 }}>
            {' '}
            ({step.machinesNeeded.toFixed(2)})
          </span>
        </span>
        <span style={{ color: '#fbbf24' }}>
          ⚡ {step.totalPower.toFixed(1)} MW
        </span>
      </div>

      {/* ── Handles (per-item) ── */}
      {step.inputRates.map((inp, i) => (
        <Handle
          key={`in-${inp.item}`}
          type="target"
          position={Position.Left}
          id={`in-${inp.item}`}
          style={{
            top: inputHandleTop(i),
            background: '#3b82f6',
            width: 10,
            height: 10,
            border: '2px solid #1d4ed8',
          }}
        />
      ))}
      {step.outputRates.map((out, i) => (
        <Handle
          key={`out-${out.item}`}
          type="source"
          position={Position.Right}
          id={`out-${out.item}`}
          style={{
            top: outputHandleTop(step.inputRates.length, i),
            background: '#22c55e',
            width: 10,
            height: 10,
            border: '2px solid #15803d',
          }}
        />
      ))}
    </div>
  )
})
