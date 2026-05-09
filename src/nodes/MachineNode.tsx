import { memo, useCallback } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { MachineNodeData } from '../utils/layout'
import { getMachineForRecipe, RAW_OVERRIDE } from '../data/loader'

// ── Machine metadata ──────────────────────────────────────────────────────────
const MACHINE_META: Record<string, { icon: string; color: string; bg: string }> = {
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
const DEFAULT_META = { icon: '⚙️', color: '#64748b', bg: '#0f172a' }
function getMeta(name: string) { return MACHINE_META[name] ?? DEFAULT_META }

// ── Handle Y position calculator ──────────────────────────────────────────────
// Header: machine-row(30px) + recipe-selector(34px) = 64px
// Column header: 20px
// Total top offset: 84px
const HANDLE_TOP_BASE = 84
const ROW_H = 22

function handleTop(idx: number): number {
  return HANDLE_TOP_BASE + idx * ROW_H + ROW_H / 2
}

// ── Component ─────────────────────────────────────────────────────────────────
export const MachineNode = memo(function MachineNode({ data, selected }: NodeProps) {
  const {
    step,
    instanceIndex,
    instanceCount,
    perMachineClock,
    perMachineInputs,
    perMachineOutputs,
    availableRecipes,
    onRecipeChange,
  } = data as MachineNodeData

  const meta = getMeta(step.machineName)

  const handleRecipeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onRecipeChange(step.itemName, e.target.value)
    },
    [step.itemName, onRecipeChange],
  )

  const hasMultipleRecipes = availableRecipes.length > 1
  const maxRows = Math.max(perMachineInputs.length, perMachineOutputs.length)

  return (
    <div
      style={{
        width: 270,
        background: '#0f172a',
        borderColor: selected ? '#f1f5f9' : meta.color,
        borderWidth: 2,
        borderStyle: 'solid',
        borderRadius: 10,
        fontSize: 12,
        color: '#cbd5e1',
        boxShadow: selected ? `0 0 0 2px ${meta.color}` : '0 4px 16px rgba(0,0,0,0.6)',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* ── Settings: machine name + instance badge + clock ── */}
      <div
        style={{
          background: meta.bg,
          borderBottom: `1px solid ${meta.color}44`,
          padding: '6px 10px 4px',
          borderRadius: '8px 8px 0 0',
        }}
      >
        {/* Machine name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 14 }}>{meta.icon}</span>
          <span style={{ fontWeight: 700, color: meta.color, fontSize: 12, flex: 1 }}>
            {step.machineName || '(未知)'}
          </span>
          <span
            style={{
              background: '#1e293b',
              color: '#94a3b8',
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 8,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            #{instanceIndex + 1}/{instanceCount}
          </span>
          <span
            style={{
              background: perMachineClock < 100 ? '#422006' : '#052e16',
              color: perMachineClock < 100 ? '#fb923c' : '#4ade80',
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 8,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {perMachineClock.toFixed(1)}%
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

        {/* Recipe selector */}
        <select
          value={step.recipe.name}
          onChange={handleRecipeChange}
          className="nodrag"
          style={{
            width: '100%',
            background: '#1e293b',
            border: `1px solid ${meta.color}66`,
            borderRadius: 5,
            color: '#e2e8f0',
            fontSize: 11,
            padding: '3px 6px',
            cursor: hasMultipleRecipes ? 'pointer' : 'default',
            outline: 'none',
            opacity: hasMultipleRecipes ? 1 : 0.7,
          }}
          disabled={!hasMultipleRecipes}
        >
          <option value={RAW_OVERRIDE}>🪨 採掘 / 原材料として扱う</option>
          {availableRecipes.map(r => {
            const machine = getMachineForRecipe(r)
            const isAlt = r.name.startsWith('代替')
            const machineDiff = machine && machine !== step.machineName
            return (
              <option key={r.name} value={r.name}>
                {isAlt ? '★ ' : ''}{r.name}
                {machineDiff ? ` [${machine}]` : ''}
              </option>
            )
          })}
        </select>
      </div>

      {/* ── Two-column body: inputs left, outputs right ── */}
      <div style={{ display: 'flex', padding: '0 0 4px' }}>
        {/* Inputs column */}
        <div style={{ flex: 1, borderRight: '1px solid #1e293b', padding: '4px 8px 0' }}>
          <div style={{ color: '#60a5fa', fontSize: 10, marginBottom: 2, fontWeight: 600 }}>
            ▼ 入力
          </div>
          {Array.from({ length: maxRows }).map((_, i) => {
            const inp = perMachineInputs[i]
            return (
              <div
                key={i}
                style={{
                  height: ROW_H,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  borderBottom: '1px solid #1e293b',
                }}
              >
                {inp ? (
                  <>
                    <span style={{ color: '#93c5fd', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inp.item}
                    </span>
                    <span style={{ color: '#60a5fa', fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
                      {inp.rate.toFixed(1)}/min
                    </span>
                  </>
                ) : null}
              </div>
            )
          })}
        </div>

        {/* Outputs column */}
        <div style={{ flex: 1, padding: '4px 8px 0' }}>
          <div style={{ color: '#4ade80', fontSize: 10, marginBottom: 2, fontWeight: 600 }}>
            ▲ 出力
          </div>
          {Array.from({ length: maxRows }).map((_, i) => {
            const out = perMachineOutputs[i]
            return (
              <div
                key={i}
                style={{
                  height: ROW_H,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  borderBottom: '1px solid #1e293b',
                }}
              >
                {out ? (
                  <>
                    <span style={{ color: '#86efac', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {out.item}
                    </span>
                    <span style={{ color: '#4ade80', fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
                      {out.rate.toFixed(1)}/min
                    </span>
                  </>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Handles ── */}
      {perMachineInputs.map((inp, i) => (
        <Handle
          key={`in-${inp.item}`}
          type="target"
          position={Position.Left}
          id={`in-${inp.item}`}
          style={{
            top: handleTop(i),
            background: '#3b82f6',
            width: 10,
            height: 10,
            border: '2px solid #1d4ed8',
          }}
        />
      ))}
      {perMachineOutputs.map((out, i) => (
        <Handle
          key={`out-${out.item}`}
          type="source"
          position={Position.Right}
          id={`out-${out.item}`}
          style={{
            top: handleTop(i),
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
