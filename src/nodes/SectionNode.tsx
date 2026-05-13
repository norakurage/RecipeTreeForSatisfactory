import { memo, useCallback } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { getMachineMeta } from '../utils/machineColors'
import { reflow } from '../utils/layout'

export type SectionNodeData = {
  itemName: string
  machineName: string
  instanceCount: number
  totalRate: number
  fullHeight: number
  inputItems: string[]
  outputItems: string[]
  collapsed: boolean
}

export const SECTION_HEADER_H = 32

export const SectionNode = memo(function SectionNode({ id, data }: NodeProps) {
  const d = data as SectionNodeData
  const meta = getMachineMeta(d.machineName)
  const { setNodes, getEdges } = useReactFlow()

  const handleY = (items: string[], i: number) =>
    SECTION_HEADER_H * (i + 1) / (items.length + 1)

  const toggleCollapsed = useCallback(() => {
    const next = !d.collapsed
    setNodes(nodes => {
      const updated = nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, collapsed: next },
            style: { ...node.style, height: next ? SECTION_HEADER_H : d.fullHeight },
          }
        }
        if (node.parentId === id) {
          return { ...node, hidden: next }
        }
        return node
      })
      return next ? reflow(updated, getEdges()) : updated
    })
  }, [id, setNodes, getEdges, d.collapsed, d.fullHeight])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: `1px solid ${meta.color}55`,
        borderRadius: 12,
        background: d.collapsed ? meta.bg : `${meta.bg}99`,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {d.inputItems.map((item, i) => (
        <Handle
          key={`sec-in-${item}`}
          type="target"
          position={Position.Left}
          id={`sec-in-${item}`}
          style={{
            top: handleY(d.inputItems, i),
            background: '#3b82f6',
            width: 10,
            height: 10,
            border: '2px solid #1d4ed8',
          }}
        />
      ))}
      {d.outputItems.map((item, i) => (
        <Handle
          key={`sec-out-${item}`}
          type="source"
          position={Position.Right}
          id={`sec-out-${item}`}
          style={{
            top: handleY(d.outputItems, i),
            background: '#22c55e',
            width: 10,
            height: 10,
            border: '2px solid #15803d',
          }}
        />
      ))}
      <div
        className="nodrag"
        onClick={toggleCollapsed}
        style={{
          height: SECTION_HEADER_H,
          background: meta.bg,
          borderBottom: d.collapsed ? 'none' : `1px solid ${meta.color}44`,
          borderRadius: d.collapsed ? 10 : '10px 10px 0 0',
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxSizing: 'border-box',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            color: meta.color,
            fontSize: 10,
            transition: 'transform 0.15s',
            transform: d.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            display: 'inline-block',
            lineHeight: 1,
          }}
        >
          ▼
        </span>
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
