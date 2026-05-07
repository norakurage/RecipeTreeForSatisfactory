import { LeftSidebar } from './components/LeftSidebar'
import { RightSidebar } from './components/RightSidebar'
import { FlowCanvas } from './components/FlowCanvas'

export default function App() {
  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#050e1a',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: '#e2e8f0',
      }}
    >
      <LeftSidebar />
      <FlowCanvas />
      <RightSidebar />
    </div>
  )
}
