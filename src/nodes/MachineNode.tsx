import { memo, useCallback } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { MachineNodeData } from '../utils/layout'
import { getMachineForRecipe, RAW_OVERRIDE } from '../data/loader'
import { getMachineMeta } from '../utils/machineColors'

const ROW_H = 32


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

  const meta = getMachineMeta(step.machineName)

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
                  overflow: 'hidden',
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
                  overflow: 'hidden',
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

    </div>
  )
})
