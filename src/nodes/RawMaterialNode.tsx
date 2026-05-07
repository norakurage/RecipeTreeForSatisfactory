import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { RawNodeData } from '../utils/layout'

export const RawMaterialNode = memo(function RawMaterialNode({
  data,
  selected,
}: NodeProps) {
  const { item, rate } = data as RawNodeData

  return (
    <div
      style={{
        width: 180,
        background: '#0f172a',
        border: `2px solid ${selected ? '#f1f5f9' : '#475569'}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        color: '#cbd5e1',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item}
      </div>
      <div style={{ color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
        {rate.toFixed(1)}/min
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
