import { useState, useMemo } from 'react'
import { useFactoryStore, getAvailableRecipes } from '../store/factoryStore'
import { allItems, RAW_OVERRIDE, getMachineForRecipe } from '../data/loader'

export function LeftSidebar() {
  const { goal, recipeOverrides, setGoal, setRecipeOverride, factoryResult } =
    useFactoryStore()

  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState(goal?.item ?? '')
  const [showDropdown, setShowDropdown] = useState(false)

  const filtered = useMemo(
    () =>
      search
        ? allItems.filter(i => i.toLowerCase().includes(search.toLowerCase()))
        : allItems,
    [search],
  )

  function handleCalculate() {
    if (!selectedItem) return
    setGoal(selectedItem, 1)
  }

  const recipeItems = factoryResult
    ? [...factoryResult.steps.values()].filter(
        s => getAvailableRecipes(s.itemName).length > 1,
      )
    : []

  return (
    <aside
      style={{
        width: 280,
        minWidth: 240,
        height: '100%',
        background: '#0d1b2a',
        borderRight: '1px solid #1e3a5f',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Title */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #1e3a5f',
          background: '#0a1520',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: '#f59e0b',
            letterSpacing: '0.05em',
          }}
        >
          🏗️ 製造ライン計算
        </h1>
        <p style={{ margin: '2px 0 0', fontSize: 10, color: '#475569' }}>
          Satisfactory Factory Calculator
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* ── Item search ── */}
        <section>
          <SectionTitle>アイテム検索</SectionTitle>
          <div style={{ position: 'relative' }}>
            <input
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="アイテム名で検索..."
              style={inputStyle}
            />
            {showDropdown && search && (
              <div
                style={{
                  position: 'absolute',
                  zIndex: 50,
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#0f2236',
                  border: '1px solid #1e3a5f',
                  borderRadius: 6,
                  maxHeight: 200,
                  overflowY: 'auto',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                }}
              >
                {filtered.slice(0, 50).map(item => (
                  <div
                    key={item}
                    onClick={() => {
                      setSelectedItem(item)
                      setSearch(item)
                      setShowDropdown(false)
                    }}
                    style={{
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: 12,
                      color: '#cbd5e1',
                      borderBottom: '1px solid #1e293b',
                      background: item === selectedItem ? '#1e3a5f' : undefined,
                    }}
                    onMouseEnter={e =>
                      ((e.target as HTMLDivElement).style.background = '#1e3a5f')
                    }
                    onMouseLeave={e =>
                      ((e.target as HTMLDivElement).style.background =
                        item === selectedItem ? '#1e3a5f' : 'transparent')
                    }
                  >
                    {item}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding: '8px 10px', color: '#475569', fontSize: 12 }}>
                    見つかりません
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Production goal ── */}
        <section>
          <SectionTitle>生産目標</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>対象アイテム</label>
            <input
              value={selectedItem}
              onChange={e => setSelectedItem(e.target.value)}
              placeholder="例: 鉄板"
              style={inputStyle}
            />
            <button
              onClick={handleCalculate}
              disabled={!selectedItem}
              style={{
                padding: '8px 0',
                background:
                  selectedItem
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : '#1e293b',
                color: selectedItem ? '#000' : '#475569',
                border: 'none',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 13,
                cursor: selectedItem ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              🔄 計算
            </button>
          </div>
        </section>

        {/* ── Recipe overrides ── */}
        {recipeItems.length > 0 && (
          <section>
            <SectionTitle>レシピ選択</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recipeItems.map(step => {
                const recipes = getAvailableRecipes(step.itemName)
                const current =
                  recipeOverrides.get(step.itemName) ?? step.recipe.name
                return (
                  <div key={step.id}>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#94a3b8',
                        marginBottom: 3,
                      }}
                    >
                      {step.itemName}
                    </div>
                    <select
                      value={current}
                      onChange={e =>
                        setRecipeOverride(step.itemName, e.target.value)
                      }
                      style={{ ...inputStyle, padding: '4px 6px' }}
                    >
                      {/* 採掘オプション（変換機などをバイパスしたい場合） */}
                      <option value={RAW_OVERRIDE}>🪨 採掘 / 原材料として扱う</option>
                      {recipes.map(r => {
                        const machine = getMachineForRecipe(r)
                        const isAlt = r.name.startsWith('代替')
                        return (
                          <option key={r.name} value={r.name}>
                            {isAlt ? '★ ' : ''}{r.name}
                            {machine ? ` [${machine}]` : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Close dropdown on outside click */}
      {showDropdown && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </aside>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: '0 0 6px',
        fontSize: 11,
        fontWeight: 700,
        color: '#f59e0b',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </h2>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0f2236',
  border: '1px solid #1e3a5f',
  borderRadius: 6,
  color: '#e2e8f0',
  padding: '6px 10px',
  fontSize: 12,
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#64748b',
}
