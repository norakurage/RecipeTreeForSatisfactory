import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { getMachineMeta } from '../utils/machineColors'

export type SectionNodeData = {
  itemName: string
  machineName: string
  instanceCount: number
  totalRate: number
}

export const SECTION_HEADER_H = 32

export const SectionNode = memo(function SectionNode({ data }: NodeProps) {
  const d = data as SectionNodeData
  const meta = getMachineMeta(d.machineName)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: `1px solid ${meta.color}55`,
        borderRadius: 12,
        background: `${meta.bg}99`,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          height: SECTION_HEADER_H,
          background: meta.bg,
          borderBottom: `1px solid ${meta.color}44`,
          borderRadius: '10px 10px 0 0',
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxSizing: 'border-box',
        }}
      >
        <span style={{ fontSize: 13 }}>{meta.icon}</span>
        <span
          style={{
            color: meta.color,
            fontSize: 12,
            fontWeight: 700,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'sans-serif',
          }}
        >
          {d.itemName}
        </span>
        <span style={{ color: '#64748b', fontSize: 10, whiteSpace: 'nowrap', fontFamily: 'sans-serif' }}>
          {d.machineName} ×{d.instanceCount}
        </span>
        <span
          style={{
            color: '#4ade80',
            fontSize: 10,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            fontFamily: 'sans-serif',
          }}
        >
          {d.totalRate.toFixed(1)}/min
        </span>
      </div>
    </div>
  )
})
