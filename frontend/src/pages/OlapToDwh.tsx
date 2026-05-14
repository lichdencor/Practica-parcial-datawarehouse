import { useContext, useState } from 'react'
import { ContentContext, ProgressContext } from '../App'
import DwhDiagramBuilder from '../components/DwhDiagramBuilder'
import DwhDiagram from '../components/DwhDiagram'
import type { DwhDiagramConfig, DwhTable } from '../data/questions'
import type { OlapToDwhExercise, OlapTable } from '../data/olap_dwh_exercises'

// ── Validation ─────────────────────────────────────────────────────────────

interface ValidationFeedback {
  type: 'ok' | 'error' | 'warning'
  category: 'tabla' | 'columna' | 'conexion'
  message: string
}

interface ValidationResult {
  score: number
  tablasScore: number
  columnasScore: number
  conexionesScore: number
  feedback: ValidationFeedback[]
  passed: boolean
}

function norm(s: string) {
  return s.toLowerCase().trim()
}

function validateDwh(student: DwhDiagramConfig, expected: DwhDiagramConfig): ValidationResult {
  const feedback: ValidationFeedback[] = []

  let tablasOk = 0, tablasMax = 0
  let columnasOk = 0, columnasMax = 0
  let conexionesOk = 0, conexionesMax = 0

  for (const expTable of expected.tables) {
    tablasMax += 1
    const stuTable = student.tables.find(t => norm(t.name) === norm(expTable.name))
    if (!stuTable) {
      feedback.push({ type: 'error', category: 'tabla', message: `Falta la tabla "${expTable.name}"` })
      continue
    }
    if (stuTable.type !== expTable.type) {
      feedback.push({ type: 'warning', category: 'tabla', message: `"${expTable.name}" debería ser ${expTable.type === 'fact' ? 'FACT' : 'Dimension'}` })
      tablasOk += 0.5
    } else {
      tablasOk += 1
      feedback.push({ type: 'ok', category: 'tabla', message: `Tabla "${expTable.name}" correcta` })
    }
    for (const expCol of expTable.columns) {
      columnasMax += 1
      const stuCol = stuTable.columns.find(c => norm(c.name) === norm(expCol.name))
      if (!stuCol) {
        feedback.push({ type: 'error', category: 'columna', message: `Falta "${expCol.name}" en ${expTable.name}` })
        continue
      }
      if ((expCol.role ?? '') !== (stuCol.role ?? '')) {
        feedback.push({ type: 'warning', category: 'columna', message: `"${expCol.name}" en ${expTable.name}: rol debería ser ${expCol.role ?? '(ninguno)'}` })
        columnasOk += 0.5
      } else {
        columnasOk += 1
      }
    }
  }

  for (const stuTable of student.tables) {
    if (!expected.tables.find(t => norm(t.name) === norm(stuTable.name))) {
      feedback.push({ type: 'warning', category: 'tabla', message: `"${stuTable.name}" no está en el esquema esperado` })
    }
  }

  for (const expConn of expected.connections) {
    conexionesMax += 1
    const found = student.connections.some(
      c => norm(c.from) === norm(expConn.from) && norm(c.to) === norm(expConn.to),
    )
    if (!found) {
      feedback.push({ type: 'error', category: 'conexion', message: `Falta conexión ${expConn.from} → ${expConn.to}` })
    } else {
      conexionesOk += 1
      feedback.push({ type: 'ok', category: 'conexion', message: `Conexión ${expConn.from} → ${expConn.to} correcta` })
    }
  }

  const tablasScore = tablasMax > 0 ? Math.round((tablasOk / tablasMax) * 100) : 100
  const columnasScore = columnasMax > 0 ? Math.round((columnasOk / columnasMax) * 100) : 100
  const conexionesScore = conexionesMax > 0 ? Math.round((conexionesOk / conexionesMax) * 100) : 100
  const score = Math.round(tablasScore * 0.35 + columnasScore * 0.40 + conexionesScore * 0.25)
  return { score, tablasScore, columnasScore, conexionesScore, feedback, passed: score >= 75 }
}

// ── OLAP Diagram (read-only export view) ────────────────────────────────────

const COL_BADGE: Record<string, string> = {
  pk: 'bg-amber-100 text-amber-700 border border-amber-200',
  fk: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
}

function OlapDiagram({ tables, onAddToDwh }: { tables: OlapTable[]; onAddToDwh: (t: OlapTable) => void }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
        {tables.map(table => (
          <div key={table.name} className="flex-shrink-0 w-48 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            {/* Table header */}
            <div className="bg-slate-700 px-3 py-2.5 flex items-center justify-between gap-2">
              <span className="text-white text-[11px] font-black font-mono tracking-wide truncate">{table.name}</span>
              <button
                onClick={() => onAddToDwh(table)}
                title="Agregar al DWH"
                className="flex-shrink-0 text-[9px] font-black bg-white/15 hover:bg-white/30 text-white px-1.5 py-0.5 rounded transition-all"
              >
                + DWH
              </button>
            </div>
            {/* Columns */}
            <div className="bg-white divide-y divide-gray-100">
              {table.columns.map(col => (
                <div key={col.name} className="flex items-center gap-1.5 px-2.5 py-1.5">
                  <span className={`text-[8px] font-black px-1 py-0.5 rounded flex-shrink-0 w-5 text-center ${
                    col.isPK ? COL_BADGE.pk : col.isFK ? COL_BADGE.fk : 'bg-transparent text-transparent'
                  }`}>
                    {col.isPK ? 'PK' : col.isFK ? 'FK' : ''}
                  </span>
                  <span className="text-[11px] font-mono text-gray-800 flex-1 truncate">{col.name}</span>
                  <span className="text-[9px] text-gray-400 font-mono flex-shrink-0">{col.type.replace(/\(.*\)/, '')}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-3 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className={`px-1 py-0.5 rounded text-[8px] font-black ${COL_BADGE.pk}`}>PK</span>
          <span className="text-gray-500">Clave primaria</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-1 py-0.5 rounded text-[8px] font-black ${COL_BADGE.fk}`}>FK</span>
          <span className="text-gray-500">Clave foránea</span>
        </div>
      </div>
    </div>
  )
}

// ── Score Bar ───────────────────────────────────────────────────────────────

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-black text-gray-800">{score}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_DWH: DwhDiagramConfig = { title: '', description: '', tables: [], connections: [] }

function autoLayout(tables: Omit<DwhTable, 'x' | 'y'>[]): DwhTable[] {
  const facts = tables.filter(t => t.type === 'fact')
  const dims = tables.filter(t => t.type !== 'fact')
  const result: DwhTable[] = []
  const centerX = 370, centerY = 230, radius = 260
  facts.forEach((t, i) => result.push({ ...t, x: centerX + i * 350, y: centerY }))
  if (dims.length === 0) return result
  dims.forEach((t, i) => {
    const angle = (2 * Math.PI / dims.length) * i - Math.PI / 2
    result.push({ ...t, x: Math.round(centerX + radius * Math.cos(angle)), y: Math.round(centerY + radius * Math.sin(angle)) })
  })
  return result
}

const DIFF_COLORS: Record<string, string> = {
  facil: 'bg-green-100 text-green-700 border-green-200',
  intermedio: 'bg-blue-100 text-blue-700 border-blue-200',
  avanzado: 'bg-purple-100 text-purple-700 border-purple-200',
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function OlapToDwh() {
  const { olapToDwhExercises } = useContext(ContentContext)
  const { progress, saveProgress } = useContext(ProgressContext)

  const [selectedId, setSelectedId] = useState<string>(olapToDwhExercises[0]?.id ?? '')
  const [studentDwh, setStudentDwh] = useState<DwhDiagramConfig>(EMPTY_DWH)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  const exercise: OlapToDwhExercise | undefined = olapToDwhExercises.find(e => e.id === selectedId)

  const selectExercise = (id: string) => {
    setSelectedId(id)
    setStudentDwh(EMPTY_DWH)
    setResult(null)
    setShowHint(false)
    setShowSolution(false)
  }

  const addOlapTableToDwh = (olapTable: OlapTable) => {
    if (studentDwh.tables.some(t => norm(t.name) === norm(olapTable.name))) return
    const newTable: DwhTable = {
      name: olapTable.name,
      type: 'dimension',
      columns: olapTable.columns.map(c => ({
        name: c.name,
        ...(c.isPK ? { role: 'pk' as const } : c.isFK ? { role: 'fk' as const } : {}),
      })),
      x: 0, y: 0,
    }
    const newTables = autoLayout([
      ...studentDwh.tables.map(({ x: _x, y: _y, ...rest }) => rest),
      newTable,
    ])
    setStudentDwh(prev => ({ ...prev, tables: newTables }))
    setResult(null)
  }

  const handleValidate = () => {
    if (!exercise) return
    const res = validateDwh(studentDwh, exercise.expectedDwh)
    setResult(res)
    if (res.passed) {
      saveProgress(`olap_dwh_${exercise.id}`, { score: res.score, completedAt: new Date().toISOString() }, true)
    }
  }

  const handleReset = () => {
    setStudentDwh(EMPTY_DWH)
    setResult(null)
    setShowSolution(false)
  }

  if (!exercise) {
    return <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400">No hay ejercicios disponibles.</div>
  }

  const isCompleted = !!progress[`olap_dwh_${exercise.id}`]
  const feedbackOk = result?.feedback.filter(f => f.type === 'ok') ?? []
  const feedbackBad = result?.feedback.filter(f => f.type !== 'ok') ?? []

  const solutionDwh: DwhDiagramConfig = {
    ...exercise.expectedDwh,
    tables: autoLayout(exercise.expectedDwh.tables.map(({ x: _x, y: _y, ...rest }) => rest)),
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-ub-dark rounded-xl flex items-center justify-center text-white shadow-lg shadow-ub-dark/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black text-ub-dark">OLAP → DWH</h2>
            <p className="text-gray-500 text-sm">Transformá esquemas OLAP normalizados en modelos Data Warehouse estrella</p>
          </div>
        </div>
      </div>

      {/* ── Exercise selector ── */}
      <div className="flex flex-wrap gap-2">
        {olapToDwhExercises.map((ex, idx) => {
          const done = !!progress[`olap_dwh_${ex.id}`]
          const isSelected = ex.id === selectedId
          return (
            <button
              key={ex.id}
              onClick={() => selectExercise(ex.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                isSelected
                  ? 'bg-ub-dark border-ub-dark text-white shadow-lg shadow-ub-dark/20'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-ub-mid/50 hover:bg-gray-50'
              }`}
            >
              {done && (
                <svg className={`w-4 h-4 ${isSelected ? 'text-green-300' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span className={`text-[10px] font-black ${isSelected ? 'text-ub-pale' : 'text-gray-400'}`}>#{idx + 1}</span>
              {ex.title}
            </button>
          )
        })}
      </div>

      {/* ── Enunciado ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-black text-lg text-ub-dark">{exercise.title}</h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${DIFF_COLORS[exercise.difficulty]}`}>
                {exercise.difficulty}
              </span>
              {isCompleted && (
                <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                  completado
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{exercise.description}</p>
          </div>
          {exercise.hint && (
            <button
              onClick={() => setShowHint(h => !h)}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {showHint ? 'Ocultar pista' : 'Ver pista'}
            </button>
          )}
        </div>
        {showHint && exercise.hint && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            {exercise.hint}
          </div>
        )}
      </div>

      {/* ── Modelo OLAP (solo lectura) ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-2 px-3">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Modelo OLAP — Entrada</span>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
              {exercise.olapTables.length} tablas normalizadas
            </span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <OlapDiagram tables={exercise.olapTables} onAddToDwh={addOlapTableToDwh} />
        </div>
      </div>

      {/* ── DWH Builder ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-2 px-3">
            <span className="w-2 h-2 rounded-full bg-ub-mid" />
            <span className="text-xs font-black uppercase tracking-widest text-ub-mid">Tu DWH — Modelado</span>
            <span className="text-[10px] bg-blue-50 text-ub-mid font-bold px-2 py-0.5 rounded-full border border-ub-mid/20">
              {studentDwh.tables.length} tablas · {studentDwh.connections.length} conexiones
            </span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <DwhDiagramBuilder value={studentDwh} onChange={v => { setStudentDwh(v); setResult(null) }} />
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleValidate}
          disabled={studentDwh.tables.length === 0}
          className="flex items-center gap-2 bg-ub-dark hover:bg-ub-mid disabled:opacity-40 disabled:cursor-not-allowed text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-ub-dark/20 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Validar esquema
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-bold px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-white transition-all text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Limpiar
        </button>
        {result && (
          <button
            onClick={() => setShowSolution(s => !s)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold px-4 py-3 rounded-xl border border-indigo-200 hover:border-indigo-300 bg-indigo-50 transition-all text-sm ml-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {showSolution ? 'Ocultar solución' : 'Ver solución'}
          </button>
        )}
      </div>

      {/* ── Validation results ── */}
      {result && (
        <div className={`rounded-2xl border p-5 ${result.passed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg ${
              result.passed ? 'bg-green-500 shadow-green-500/30' : result.score >= 50 ? 'bg-amber-500 shadow-amber-500/30' : 'bg-red-500 shadow-red-500/30'
            }`}>
              {result.score}%
            </div>
            <div>
              <div className="font-black text-gray-800 text-base">
                {result.passed ? '¡Esquema correcto!' : result.score >= 50 ? 'Casi — revisá los detalles' : 'Necesita más trabajo'}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {feedbackOk.length} items correctos · {feedbackBad.length} para revisar
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-5">
            <ScoreBar label="Tablas" score={result.tablasScore} />
            <ScoreBar label="Columnas y roles" score={result.columnasScore} />
            <ScoreBar label="Conexiones" score={result.conexionesScore} />
          </div>

          {feedbackBad.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Para corregir</p>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {feedbackBad.map((f, i) => (
                  <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${
                    f.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {f.type === 'error'
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
                    </svg>
                    <span>
                      <span className="font-black uppercase text-[9px] mr-1">[{f.category}]</span>
                      {f.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feedbackOk.length > 0 && (
            <details>
              <summary className="text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer select-none">
                Ver {feedbackOk.length} items correctos
              </summary>
              <div className="space-y-1 mt-2 max-h-40 overflow-y-auto pr-1">
                {feedbackOk.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700">
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f.message}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* ── Solution ── */}
      {showSolution && (
        <div className="bg-white border border-indigo-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-indigo-100" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 px-3">Solución esperada</span>
            <div className="h-px flex-1 bg-indigo-100" />
          </div>
          <DwhDiagram diagram={solutionDwh} />
        </div>
      )}

    </div>
  )
}
