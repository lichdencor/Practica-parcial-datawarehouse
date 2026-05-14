import { useState, useContext } from 'react'
import { ContentContext } from '../App'
import DwhDiagramBuilder from './DwhDiagramBuilder'
import type { DwhDiagramConfig } from '../data/questions'
import type { OlapToDwhExercise, OlapTable, OlapColumn } from '../data/olap_dwh_exercises'

const EMPTY_DWH: DwhDiagramConfig = { title: '', description: '', tables: [], connections: [] }

const EMPTY_EXERCISE: Omit<OlapToDwhExercise, 'id'> = {
  title: '',
  description: '',
  difficulty: 'intermedio',
  hint: '',
  olapTables: [],
  expectedDwh: EMPTY_DWH,
}

// ── OLAP Table Editor ────────────────────────────────────────────────────────

function OlapTableEditor({
  table,
  onChange,
  onRemove,
}: {
  table: OlapTable
  onChange: (t: OlapTable) => void
  onRemove: () => void
}) {
  const [newColName, setNewColName] = useState('')
  const [newColType, setNewColType] = useState('INT')
  const [newColPK, setNewColPK] = useState(false)
  const [newColFK, setNewColFK] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const addCol = () => {
    if (!newColName.trim()) return
    const col: OlapColumn = {
      name: newColName.trim(),
      type: newColType,
      ...(newColPK ? { isPK: true } : {}),
      ...(newColFK ? { isFK: true } : {}),
    }
    onChange({ ...table, columns: [...table.columns, col] })
    setNewColName('')
    setNewColPK(false)
    setNewColFK(false)
  }

  const removeCol = (i: number) => {
    onChange({ ...table, columns: table.columns.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 bg-slate-700 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-white text-xs font-black font-mono">{table.name || '(sin nombre)'}</span>
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-[10px]">{table.columns.length} cols</span>
          <button
            onClick={e => { e.stopPropagation(); onRemove() }}
            className="text-white/50 hover:text-red-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 space-y-3">
          <div>
            <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Nombre de la tabla</label>
            <input
              type="text"
              value={table.name}
              onChange={e => onChange({ ...table, name: e.target.value })}
              className="w-full text-xs font-mono font-bold p-1.5 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
            />
          </div>

          {/* Columns list */}
          <div>
            <p className="text-[9px] font-black uppercase text-gray-400 mb-1.5">Columnas</p>
            <div className="space-y-1 mb-2">
              {table.columns.map((col, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded px-2 py-1">
                  {col.isPK && <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-1 rounded">PK</span>}
                  {col.isFK && <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 px-1 rounded">FK</span>}
                  {!col.isPK && !col.isFK && <span className="w-5" />}
                  <span className="text-[11px] font-mono flex-1">{col.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono">{col.type}</span>
                  <button onClick={() => removeCol(i)} className="text-gray-300 hover:text-red-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add column */}
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newColName}
                  onChange={e => setNewColName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCol()}
                  placeholder="nombre_columna"
                  className="flex-1 text-[11px] font-mono p-1.5 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                />
                <input
                  type="text"
                  value={newColType}
                  onChange={e => setNewColType(e.target.value)}
                  placeholder="INT"
                  className="w-20 text-[11px] font-mono p-1.5 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={newColPK} onChange={e => setNewColPK(e.target.checked)} className="w-3 h-3" />
                  PK
                </label>
                <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={newColFK} onChange={e => setNewColFK(e.target.checked)} className="w-3 h-3" />
                  FK
                </label>
                <button
                  onClick={addCol}
                  className="ml-auto bg-slate-700 text-white px-3 rounded text-[10px] font-black hover:bg-slate-800 py-1"
                >
                  + Agregar columna
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Creator ─────────────────────────────────────────────────────────────

export default function OlapToDwhCreator() {
  const { olapToDwhExercises, saveContent } = useContext(ContentContext)
  const [exercises, setExercises] = useState<OlapToDwhExercise[]>(olapToDwhExercises)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<OlapToDwhExercise | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'meta' | 'olap' | 'dwh'>('meta')

  const startCreate = () => {
    const newId = `olap_ex_${Date.now()}`
    const newEx: OlapToDwhExercise = { id: newId, ...EMPTY_EXERCISE }
    setDraft(newEx)
    setEditingId(newId)
    setActiveTab('meta')
  }

  const startEdit = (ex: OlapToDwhExercise) => {
    setDraft({ ...ex })
    setEditingId(ex.id)
    setActiveTab('meta')
  }

  const cancelEdit = () => {
    setDraft(null)
    setEditingId(null)
  }

  const saveExercise = async () => {
    if (!draft) return
    if (!draft.title.trim() || !draft.id.trim()) {
      setError('ID y título son obligatorios.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const existing = exercises.find(e => e.id === draft.id)
      const updated = existing
        ? exercises.map(e => e.id === draft.id ? draft : e)
        : [...exercises, draft]
      await saveContent('olapToDwh', updated)
      setExercises(updated)
      setDraft(null)
      setEditingId(null)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const removeExercise = async (id: string) => {
    if (!confirm('¿Eliminar este ejercicio?')) return
    const updated = exercises.filter(e => e.id !== id)
    try {
      await saveContent('olapToDwh', updated)
      setExercises(updated)
      if (editingId === id) cancelEdit()
    } catch (err: any) {
      setError(err.message ?? 'Error al eliminar')
    }
  }

  const addOlapTable = () => {
    if (!draft) return
    const newTable: OlapTable = { name: `TABLA_${draft.olapTables.length + 1}`, columns: [] }
    setDraft({ ...draft, olapTables: [...draft.olapTables, newTable] })
  }

  const updateOlapTable = (idx: number, t: OlapTable) => {
    if (!draft) return
    setDraft({ ...draft, olapTables: draft.olapTables.map((ot, i) => i === idx ? t : ot) })
  }

  const removeOlapTable = (idx: number) => {
    if (!draft) return
    setDraft({ ...draft, olapTables: draft.olapTables.filter((_, i) => i !== idx) })
  }

  const DIFF_COLORS: Record<string, string> = {
    facil: 'bg-green-100 text-green-700',
    intermedio: 'bg-blue-100 text-blue-700',
    avanzado: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
      )}

      {/* Exercise list */}
      {!editingId && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Ejercicios OLAP→DWH ({exercises.length})
            </p>
            <button
              onClick={startCreate}
              className="flex items-center gap-1.5 bg-ub-dark text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-ub-mid transition-all"
            >
              + Nuevo ejercicio
            </button>
          </div>

          <div className="space-y-2">
            {exercises.map(ex => (
              <div
                key={ex.id}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm text-gray-800 truncate">{ex.title}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${DIFF_COLORS[ex.difficulty]}`}>
                      {ex.difficulty}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">{ex.id}</span>
                  <span className="text-[10px] text-gray-400 ml-2">
                    · {ex.olapTables.length} tablas OLAP · {ex.expectedDwh.tables.length} tablas DWH
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(ex)}
                    className="text-xs font-bold text-ub-mid hover:text-ub-dark px-3 py-1.5 rounded-lg border border-ub-mid/30 hover:border-ub-mid transition-all"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => removeExercise(ex.id)}
                    className="text-xs font-bold text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-lg border border-gray-200 hover:border-red-200 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {exercises.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No hay ejercicios. Creá el primero.</p>
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      {editingId && draft && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-black text-gray-800">
              {exercises.find(e => e.id === draft.id) ? `Editando: ${draft.title || draft.id}` : 'Nuevo ejercicio'}
            </h4>
            <button onClick={cancelEdit} className="text-xs text-gray-400 hover:text-gray-600 font-bold">
              ← Volver a la lista
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
            {(['meta', 'olap', 'dwh'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeTab === tab ? 'bg-white text-ub-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'meta' ? 'Metadatos' : tab === 'olap' ? 'Tablas OLAP' : 'DWH Esperado'}
              </button>
            ))}
          </div>

          {/* Tab: Meta */}
          {activeTab === 'meta' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">ID único</label>
                  <input
                    type="text"
                    value={draft.id}
                    onChange={e => setDraft({ ...draft, id: e.target.value })}
                    className="w-full text-xs font-mono p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-ub-mid"
                    placeholder="olap_ventas"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Dificultad</label>
                  <select
                    value={draft.difficulty}
                    onChange={e => setDraft({ ...draft, difficulty: e.target.value as OlapToDwhExercise['difficulty'] })}
                    className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-ub-mid"
                  >
                    <option value="facil">Fácil</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Título</label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={e => setDraft({ ...draft, title: e.target.value })}
                  className="w-full text-sm font-bold p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-ub-mid"
                  placeholder="Sistema de Ventas"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Descripción</label>
                <textarea
                  value={draft.description}
                  onChange={e => setDraft({ ...draft, description: e.target.value })}
                  rows={3}
                  className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-ub-mid resize-none"
                  placeholder="Descripción del contexto del ejercicio..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Pista (opcional)</label>
                <textarea
                  value={draft.hint ?? ''}
                  onChange={e => setDraft({ ...draft, hint: e.target.value })}
                  rows={2}
                  className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-ub-mid resize-none"
                  placeholder="Pista para el alumno..."
                />
              </div>
            </div>
          )}

          {/* Tab: OLAP Tables */}
          {activeTab === 'olap' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Estas son las tablas normalizadas que verá el alumno como punto de partida.
                </p>
                <button
                  onClick={addOlapTable}
                  className="text-xs font-black bg-slate-700 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all"
                >
                  + Agregar tabla
                </button>
              </div>
              {draft.olapTables.map((t, i) => (
                <OlapTableEditor
                  key={i}
                  table={t}
                  onChange={nt => updateOlapTable(i, nt)}
                  onRemove={() => removeOlapTable(i)}
                />
              ))}
              {draft.olapTables.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6 border-2 border-dashed border-gray-200 rounded-xl">
                  Agregá las tablas OLAP del dominio
                </p>
              )}
            </div>
          )}

          {/* Tab: Expected DWH */}
          {activeTab === 'dwh' && (
            <div>
              <p className="text-xs text-gray-500 mb-4">
                Construí el esquema DWH esperado. Este se usa como respuesta correcta para validar la solución del alumno.
              </p>
              <DwhDiagramBuilder
                value={draft.expectedDwh}
                onChange={dwh => setDraft({ ...draft, expectedDwh: dwh })}
              />
            </div>
          )}

          {/* Save bar */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={saveExercise}
              disabled={saving}
              className="flex items-center gap-2 bg-ub-dark text-white text-sm font-black px-6 py-2.5 rounded-xl hover:bg-ub-mid disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? 'Guardando…' : 'Guardar ejercicio'}
            </button>
            <button
              onClick={cancelEdit}
              className="text-sm font-bold text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
