import { useState } from 'react'
import DwhDiagram from './DwhDiagram'
import type { DwhDiagramConfig, DwhTable } from '../data/questions'

// Auto-layout: FACT centrado, DIMENSIONes distribuidas en círculo
function autoLayout(tables: Omit<DwhTable, 'x' | 'y'>[]): DwhTable[] {
  const facts = tables.filter(t => t.type === 'fact')
  const dims = tables.filter(t => t.type !== 'fact')
  const result: DwhTable[] = []

  const centerX = 370
  const centerY = 230
  const radius = 260

  facts.forEach((t, i) => {
    result.push({ ...t, x: centerX + i * 350, y: centerY })
  })

  if (dims.length === 0) return result

  dims.forEach((t, i) => {
    const angle = (2 * Math.PI / dims.length) * i - Math.PI / 2
    result.push({
      ...t,
      x: Math.round(centerX + radius * Math.cos(angle)),
      y: Math.round(centerY + radius * Math.sin(angle)),
    })
  })

  return result
}

type BuilderTable = Omit<DwhTable, 'x' | 'y'>
type ColRole = 'pk' | 'fk' | 'measure' | ''

interface DwhDiagramBuilderProps {
  value: DwhDiagramConfig
  onChange: (config: DwhDiagramConfig) => void
}

const TYPE_LABELS: Record<string, string> = {
  fact: 'FACT',
  dimension: 'Dimension',
  dimension2: 'Dimension 2',
}

const ROLE_COLORS: Record<string, string> = {
  pk: 'bg-amber-100 text-amber-700',
  fk: 'bg-blue-100 text-blue-700',
  measure: 'bg-green-100 text-green-700',
  '': 'bg-gray-100 text-gray-500',
}

export default function DwhDiagramBuilder({ value, onChange }: DwhDiagramBuilderProps) {
  const tables: BuilderTable[] = value.tables.map(({ x: _x, y: _y, ...rest }) => rest)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [newColName, setNewColName] = useState('')
  const [newColRole, setNewColRole] = useState<ColRole>('')
  const [newConnFrom, setNewConnFrom] = useState('')
  const [newConnTo, setNewConnTo] = useState('')

  const emit = (newTables: BuilderTable[], newConns?: DwhDiagramConfig['connections']) => {
    onChange({
      ...value,
      tables: autoLayout(newTables),
      connections: newConns ?? value.connections,
    })
  }

  const updateMeta = (field: 'title' | 'description', val: string) => {
    onChange({ ...value, [field]: val })
  }

  const addTable = () => {
    const newTable: BuilderTable = { name: `Nueva_Tabla_${tables.length + 1}`, type: 'dimension', columns: [] }
    emit([...tables, newTable])
    setEditingIdx(tables.length)
  }

  const removeTable = (idx: number) => {
    const name = tables[idx].name
    const newTables = tables.filter((_, i) => i !== idx)
    const newConns = value.connections.filter(c => c.from !== name && c.to !== name)
    setEditingIdx(null)
    emit(newTables, newConns)
  }

  const updateTable = (idx: number, patch: Partial<BuilderTable>) => {
    const oldName = tables[idx].name
    const newTables = tables.map((t, i) => i === idx ? { ...t, ...patch } : t)
    let newConns = value.connections
    if (patch.name && patch.name !== oldName) {
      newConns = value.connections.map(c => ({
        from: c.from === oldName ? patch.name! : c.from,
        to: c.to === oldName ? patch.name! : c.to,
      }))
    }
    emit(newTables, newConns)
  }

  const addColumn = (tableIdx: number) => {
    if (!newColName.trim()) return
    const col = { name: newColName.trim(), ...(newColRole ? { role: newColRole as 'pk' | 'fk' | 'measure' } : {}) }
    const newCols = [...tables[tableIdx].columns, col]
    updateTable(tableIdx, { columns: newCols })
    setNewColName('')
    setNewColRole('')
  }

  const removeColumn = (tableIdx: number, colIdx: number) => {
    const newCols = tables[tableIdx].columns.filter((_, i) => i !== colIdx)
    updateTable(tableIdx, { columns: newCols })
  }

  const addConnection = () => {
    if (!newConnFrom || !newConnTo || newConnFrom === newConnTo) return
    const exists = value.connections.some(c => c.from === newConnFrom && c.to === newConnTo)
    if (exists) return
    emit(tables, [...value.connections, { from: newConnFrom, to: newConnTo }])
    setNewConnFrom('')
    setNewConnTo('')
  }

  const removeConnection = (idx: number) => {
    const newConns = value.connections.filter((_, i) => i !== idx)
    emit(tables, newConns)
  }

  const previewConfig: DwhDiagramConfig = {
    ...value,
    tables: autoLayout(tables),
  }

  return (
    <div className="space-y-4">
      {/* Meta */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Título del Diagrama</label>
          <input
            type="text"
            value={value.title}
            onChange={e => updateMeta('title', e.target.value)}
            className="w-full text-xs font-bold p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-ub-mid"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Descripción</label>
          <input
            type="text"
            value={value.description}
            onChange={e => updateMeta('description', e.target.value)}
            className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-ub-mid"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Left panel: tables + connections */}
        <div className="lg:col-span-2 space-y-3">
          {/* Tables */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tablas ({tables.length})</p>
              <button
                onClick={addTable}
                className="text-[10px] font-black text-ub-mid hover:text-ub-dark flex items-center gap-1"
              >
                + Agregar
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {tables.map((t, idx) => (
                <div key={idx} className={`rounded-xl border transition-all ${editingIdx === idx ? 'border-ub-mid bg-blue-50/50' : 'border-gray-200 bg-white'}`}>
                  {/* Table header row */}
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer"
                    onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${t.type === 'fact' ? 'bg-ub-dark text-white' : 'bg-ub-pale text-ub-mid border border-ub-mid/20'}`}>
                        {TYPE_LABELS[t.type]}
                      </span>
                      <span className="text-xs font-bold truncate">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">{t.columns.length} cols</span>
                      <button
                        onClick={e => { e.stopPropagation(); removeTable(idx) }}
                        className="text-gray-300 hover:text-red-500 p-0.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded editor */}
                  {editingIdx === idx && (
                    <div className="px-3 pb-3 space-y-3 border-t border-ub-mid/10">
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div>
                          <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Nombre</label>
                          <input
                            type="text"
                            value={t.name}
                            onChange={e => updateTable(idx, { name: e.target.value })}
                            className="w-full text-[11px] font-mono font-bold p-1.5 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Tipo</label>
                          <select
                            value={t.type}
                            onChange={e => updateTable(idx, { type: e.target.value as DwhTable['type'] })}
                            className="w-full text-[11px] font-bold p-1.5 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                          >
                            <option value="fact">FACT</option>
                            <option value="dimension">Dimension</option>
                            <option value="dimension2">Dimension 2</option>
                          </select>
                        </div>
                      </div>

                      {/* Columns */}
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-400 mb-1.5">Columnas</p>
                        <div className="space-y-1 mb-2">
                          {t.columns.map((col, ci) => (
                            <div key={ci} className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-black px-1 rounded ${ROLE_COLORS[col.role ?? '']}`}>
                                {col.role?.toUpperCase() ?? '—'}
                              </span>
                              <span className="text-[11px] font-mono flex-1 truncate">{col.name}</span>
                              <button onClick={() => removeColumn(idx, ci)} className="text-gray-300 hover:text-red-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={newColName}
                            onChange={e => setNewColName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addColumn(idx)}
                            placeholder="nombre_columna"
                            className="flex-1 text-[11px] font-mono p-1.5 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                          />
                          <select
                            value={newColRole}
                            onChange={e => setNewColRole(e.target.value as ColRole)}
                            className="text-[10px] p-1.5 rounded border border-gray-200 focus:outline-none"
                          >
                            <option value="">—</option>
                            <option value="pk">PK</option>
                            <option value="fk">FK</option>
                            <option value="measure">Medida</option>
                          </select>
                          <button
                            onClick={() => addColumn(idx)}
                            className="bg-ub-mid text-white px-2 rounded text-[10px] font-black hover:bg-ub-dark"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Connections */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Conexiones ({value.connections.length})</p>
            <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
              {value.connections.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] bg-gray-50 rounded-lg px-2 py-1">
                  <span className="font-mono font-bold text-ub-dark">{c.from}</span>
                  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-mono font-bold text-ub-mid flex-1">{c.to}</span>
                  <button onClick={() => removeConnection(i)} className="text-gray-300 hover:text-red-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              <select
                value={newConnFrom}
                onChange={e => setNewConnFrom(e.target.value)}
                className="flex-1 text-[11px] p-1.5 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
              >
                <option value="">Desde…</option>
                {tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
              <select
                value={newConnTo}
                onChange={e => setNewConnTo(e.target.value)}
                className="flex-1 text-[11px] p-1.5 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
              >
                <option value="">Hacia…</option>
                {tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
              <button
                onClick={addConnection}
                className="bg-ub-mid text-white px-2.5 rounded text-[10px] font-black hover:bg-ub-dark"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Right panel: live preview */}
        <div className="lg:col-span-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Vista Previa</p>
          {tables.length > 0 ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <DwhDiagram diagram={previewConfig} />
            </div>
          ) : (
            <div className="h-48 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
              <p className="text-gray-400 text-sm">Agrega tablas para ver la vista previa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
