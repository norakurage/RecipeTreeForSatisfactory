import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  BackgroundVariant,
  useReactFlow,
  useNodes,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useFactoryStore } from '../store/factoryStore'
import { MachineNode } from '../nodes/MachineNode'
import { RawMaterialNode } from '../nodes/RawMaterialNode'
import { PoolNode } from '../nodes/PoolNode'
import { SectionNode, SECTION_HEADER_H, type SectionNodeData } from '../nodes/SectionNode'
import { reflow } from '../utils/layout'

const nodeTypes: NodeTypes = {
  machine: MachineNode,
  rawMaterial: RawMaterialNode,
  pool: PoolNode,
  section: SectionNode,
}

function CollapseAllButton() {
  const nodes = useNodes()
  const { setNodes, getEdges } = useReactFlow()

  const sections = nodes.filter(n => n.type === 'section')
  if (sections.length === 0) return null

  const allCollapsed = sections.every(n => (n.data as SectionNodeData).collapsed)

  const toggle = () => {
    const next = !allCollapsed
    setNodes(ns => {
      const updated = ns.map(node => {
        if (node.type === 'section') {
          return {
            ...node,
            data: { ...node.data, collapsed: next },
            style: { ...node.style, height: next ? SECTION_HEADER_H : (node.data as SectionNodeData).fullHeight },
          }
        }
        if (node.type === 'machine') {
          return { ...node, hidden: next }
        }
        return node
      })
      return next ? reflow(updated, getEdges()) : updated
    })
  }

  return (
    <Panel position="top-left">
      <button
        onClick={toggle}
        style={{
          background: '#0d1b2a',
          border: '1px solid #1e3a5f',
          borderRadius: 8,
          color: '#94a3b8',
          fontSize: 12,
          padding: '5px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'sans-serif',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1e293b')}
        onMouseLeave={e => (e.currentTarget.style.background = '#0d1b2a')}
      >
        <span style={{ fontSize: 10 }}>{allCollapsed ? '▼' : '▲'}</span>
        {allCollapsed ? '全て展開' : '全て折りたたむ'}
      </button>
    </Panel>
  )
}

export function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, factoryResult } =
    useFactoryStore()

  const onNodesChangeCb = useCallback(onNodesChange, [onNodesChange])
  const onEdgesChangeCb = useCallback(onEdgesChange, [onEdgesChange])

  return (
    <div style={{ flex: 1, height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeCb}
        onEdgesChange={onEdgesChangeCb}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        style={{ background: '#050e1a' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#1e3a5f"
          gap={24}
          size={1.5}
        />
        <Controls
          style={{
            background: '#0d1b2a',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
          }}
        />
        <MiniMap
          style={{
            background: '#0a1520',
            border: '1px solid #1e3a5f',
          }}
          maskColor="rgba(0,0,0,0.6)"
          nodeColor={n =>
            n.type === 'rawMaterial' ? '#475569' : n.type === 'pool' ? '#22c55e' : '#3b82f6'
          }
        />
        <CollapseAllButton />
      </ReactFlow>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#334155',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏗️</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>製造ラインを設定してください</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>
            左サイドバーでアイテムと生産量を入力し、「計算」を押してください
          </div>
        </div>
      )}

      {/* Step count badge */}
      {factoryResult && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0d1b2a',
            border: '1px solid #1e3a5f',
            borderRadius: 20,
            padding: '4px 14px',
            fontSize: 11,
            color: '#94a3b8',
            pointerEvents: 'none',
            zIndex: 10,
            display: 'flex',
            gap: 14,
          }}
        >
          <span>
            🔄 工程 <strong style={{ color: '#f59e0b' }}>{factoryResult.steps.size}</strong>
          </span>
          <span>
            🪨 採掘 <strong style={{ color: '#94a3b8' }}>{factoryResult.rawMaterials.size}</strong>
          </span>
          <span>
            ⚡ <strong style={{ color: '#fbbf24' }}>{factoryResult.totalPower.toFixed(1)} MW</strong>
          </span>
        </div>
      )}
    </div>
  )
}
