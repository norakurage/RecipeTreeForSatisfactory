import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { PoolNodeData } from '../utils/layout'

export const PoolNode = memo(function PoolNode({ data }: NodeProps) {
  const { item, totalRate } = data as PoolNodeData

  return (
    <div
      style={{
        width: 130,
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: 6,
        fontSize: 11,
        color: '#94a3b8',
        fontFamily: 'sans-serif',
        padding: '6px 10px 7px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        position: 'relative',
      }}
    >
      <div style={{ color: '#475569', fontSize: 9, fontWeight: 600, letterSpacing: '0.06em' }}>
        ⟳ プール
      </div>
      <div
        style={{
          color: '#e2e8f0',
          fontWeight: 600,
          fontSize: 11,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item}
      </div>
      <div
        style={{
          color: '#4ade80',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {totalRate.toFixed(1)}/min
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id={`in-${item}`}
        style={{ background: '#475569', width: 8, height: 8, border: '1px solid #64748b' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`out-${item}`}
        style={{ background: '#22c55e', width: 8, height: 8, border: '1px solid #15803d' }}
      />
    </div>
  )
})
