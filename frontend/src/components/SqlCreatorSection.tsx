import { useState, useContext } from 'react'
import { ContentContext } from '../App'
import Modal from './Modal'
import { SCHEMAS } from '../data/sql_schemas'

// ─── sql.js singleton ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sqlPromise: Promise<any> | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSql(): Promise<any> {
  if (!_sqlPromise) {
    _sqlPromise = import('sql.js').then(m =>
      m.default({ locateFile: () => '/sql-wasm.wasm' })
    )
  }
  return _sqlPromise
}

// ─── Types ───────────────────────────────────────────────────────────────────
type Difficulty = 'facil' | 'intermedio' | 'avanzado' | 'reto'

interface Draft {
  id: string
  title: string
  difficulty: Difficulty
  metric: string
  description: string
  objective: string
  hint: string
  dimensionsRaw: string
  schemaRef: string
  setupSql: string
  referenceQuery: string
  verifyQuery: string
}

interface ValidationResult {
  ok: boolean
  error?: string
  columns?: string[]
  rows?: (string | number | null)[][]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 36)
}

const SCHEMA_KEYS = ['', ...Object.keys(SCHEMAS)]

const EMPTY: Draft = {
  id: '', title: '', difficulty: 'intermedio',
  metric: '', description: '', objective: '', hint: '',
  dimensionsRaw: '', schemaRef: '', setupSql: '', referenceQuery: '', verifyQuery: '',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
        {label}
        {note && <span className="ml-1.5 normal-case font-normal text-gray-300">{note}</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full text-sm p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-ub-mid'
const codeCls = 'w-full text-xs font-mono p-3 rounded-xl border border-gray-700 bg-gray-900 text-green-300 focus:outline-none focus:border-ub-mid resize-y'

function SqlResultTable({ columns, rows }: { columns: string[]; rows: (string | number | null)[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700 mt-2">
      <table className="text-xs font-mono w-full">
        <thead>
          <tr className="bg-gray-700">
            {columns.map(c => (
              <th key={c} className="px-3 py-1.5 text-left text-gray-300 font-semibold whitespace-nowrap border-r border-gray-600 last:border-r-0">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}>
              {row.map((v, j) => (
                <td key={j} className="px-3 py-1 text-green-300 border-r border-gray-700 last:border-r-0 whitespace-nowrap">
                  {v === null ? <span className="text-gray-500 italic">NULL</span> : String(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 10 && (
        <p className="text-[10px] text-gray-500 px-3 py-1 bg-gray-900 border-t border-gray-700">
          {rows.length} filas en total — mostrando 10.
        </p>
      )}
    </div>
  )
}

function CopyBlock({ label, note, text }: { label: string; note: string; text: string }) {
  const [copied, setCopied] = useState(false)
  const doCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div>
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{label}</p>
          <p className="text-[10px] text-gray-400">{note}</p>
        </div>
        <button
          onClick={doCopy}
          className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all ${
            copied ? 'bg-green-100 text-green-700' : 'bg-white border border-gray-200 text-gray-600 hover:border-ub-mid hover:text-ub-mid'
          }`}
        >
          {copied ? (
            '✓ Copiado'
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar JSON
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-950 text-green-400 text-[10px] font-mono p-4 overflow-x-auto whitespace-pre max-h-52 overflow-y-auto">
        {text}
      </pre>
    </div>
  )
}

// ─── Editor Modal ─────────────────────────────────────────────────────────────
function CreatorModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { sqlPractices, saveContent } = useContext(ContentContext)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [validating, setValidating] = useState(false)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const set = (k: keyof Draft, v: string) =>
    setDraft(prev => {
      const next = { ...prev, [k]: v }
      if (k === 'title' && !prev.id) next.id = `sql_${slugify(v)}`
      if (k !== 'id') setValidation(null)
      return next
    })

  // ── Validate ──
  const handleValidate = async () => {
    setValidating(true)
    setValidation(null)
    try {
      const SQL = await getSql()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db: any = new SQL.Database()
      const effectiveSetup = draft.setupSql.trim() || (draft.schemaRef ? SCHEMAS[draft.schemaRef] : '')
      if (effectiveSetup) db.run(effectiveSetup)
      const ref = draft.referenceQuery.trim()
      const isSelect = /^\s*(SELECT|WITH)\b/i.test(ref)
      if (isSelect) {
        const res = db.exec(ref)
        db.close()
        const r = res[0]
        setValidation(r
          ? { ok: true, columns: r.columns, rows: r.values }
          : { ok: true, columns: [], rows: [] }
        )
      } else {
        db.run(ref)
        if (draft.verifyQuery.trim()) {
          const res = db.exec(draft.verifyQuery.trim())
          db.close()
          const r = res[0]
          setValidation(r
            ? { ok: true, columns: r.columns, rows: r.values }
            : { ok: true, columns: [], rows: [] }
          )
        } else {
          db.close()
          setValidation({ ok: true, columns: [], rows: [] })
        }
      }
    } catch (err: unknown) {
      setValidation({ ok: false, error: err instanceof Error ? err.message : String(err) })
    } finally {
      setValidating(false)
    }
  }

  // ── Save to MongoDB ──
  const handleSave = async () => {
    if (!draft.id || !draft.title || !draft.referenceQuery.trim()) {
      setSaveError('ID, título y consulta de referencia son obligatorios.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const item: Record<string, unknown> = {
        id: draft.id,
        difficulty: draft.difficulty,
        title: draft.title,
        description: draft.description,
        objective: draft.objective,
        hint: draft.hint,
        referenceQuery: draft.referenceQuery,
      }
      if (draft.schemaRef)          item.schemaRef   = draft.schemaRef
      if (draft.setupSql.trim())    item.setupSql    = draft.setupSql
      if (draft.verifyQuery.trim()) item.verifyQuery  = draft.verifyQuery
      await saveContent('sqlPractices', [...sqlPractices, item])
      onSaved()
      onClose()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ── Output snippets ──
  const dimensions = draft.dimensionsRaw.split(',').map(s => s.trim()).filter(Boolean)

  const practiceObj: Record<string, unknown> = {
    id: draft.id || `sql_nuevo`,
    difficulty: draft.difficulty,
    title: draft.title,
    description: draft.description,
    objective: draft.objective,
    hint: draft.hint,
    referenceQuery: draft.referenceQuery,
  }
  if (draft.schemaRef)          practiceObj.schemaRef   = draft.schemaRef
  if (draft.setupSql.trim())    practiceObj.setupSql    = draft.setupSql
  if (draft.verifyQuery.trim()) practiceObj.verifyQuery  = draft.verifyQuery

  const exerciseObj: Record<string, unknown> = {
    id: draft.id || `sql_nuevo`,
    metric: draft.metric || draft.title,
    description: draft.description,
    dimensions,
    hint: draft.hint,
    referenceQuery: draft.referenceQuery,
  }
  if (draft.schemaRef)          exerciseObj.schemaRef   = draft.schemaRef
  if (draft.setupSql.trim())    exerciseObj.setupSql    = draft.setupSql
  if (draft.verifyQuery.trim()) exerciseObj.verifyQuery  = draft.verifyQuery

  const hasSchema   = !!(draft.schemaRef || draft.setupSql.trim())
  const canValidate = !!draft.referenceQuery.trim()
  const canSave     = !!(draft.id && draft.title && draft.referenceQuery.trim())

  return (
    <div className="grid grid-cols-2 gap-6 min-h-0">

      {/* ── Columna izquierda: formulario ── */}
      <div className="space-y-5 overflow-y-auto pr-1" style={{ maxHeight: 'calc(90vh - 120px)' }}>

        {/* Identificación */}
        <section>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-ub-dark text-white text-[9px] flex items-center justify-center">1</span>
            Identificación
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Título">
                <input value={draft.title} onChange={e => set('title', e.target.value)}
                  placeholder="Ej: Ventas por categoría" className={inputCls} />
              </Field>
              <Field label="ID generado">
                <input value={draft.id} onChange={e => set('id', e.target.value)}
                  placeholder="sql_ventas_cat" className={`${inputCls} font-mono text-xs text-gray-500`} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Dificultad">
                <select value={draft.difficulty} onChange={e => set('difficulty', e.target.value)}
                  className={`${inputCls} text-sm font-bold`}>
                  <option value="facil">Fácil</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                  <option value="reto">Reto</option>
                </select>
              </Field>
              <Field label="Dimensiones" note="coma-separadas">
                <input value={draft.dimensionsRaw} onChange={e => set('dimensionsRaw', e.target.value)}
                  placeholder="Dim_Producto, Dim_Tiempo" className={inputCls} />
              </Field>
            </div>
            <Field label="Métrica" note="nombre del ejercicio en el integrador">
              <input value={draft.metric} onChange={e => set('metric', e.target.value)}
                placeholder="Ej: Métrica 1: Ventas totales por categoría" className={inputCls} />
            </Field>
          </div>
        </section>

        {/* Consigna */}
        <section>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-ub-dark text-white text-[9px] flex items-center justify-center">2</span>
            Consigna
          </h4>
          <div className="space-y-3">
            <Field label="Descripción / Contexto">
              <textarea value={draft.description} onChange={e => set('description', e.target.value)}
                rows={2} placeholder="Ej: Calcular ventas agrupadas por categoría usando FACT_VENTA_FACTURA..."
                className="w-full text-sm p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-ub-mid resize-none" />
            </Field>
            <Field label="Objetivo" note="qué debe escribir el alumno">
              <textarea value={draft.objective} onChange={e => set('objective', e.target.value)}
                rows={3} placeholder="Ej: Escribí una query que devuelva las ventas totales agrupadas por categoría y marca..."
                className="w-full text-sm p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-ub-mid resize-none font-medium" />
            </Field>
            <Field label="Pista (hint)">
              <input value={draft.hint} onChange={e => set('hint', e.target.value)}
                placeholder="Ej: Necesitás JOINs encadenados: FACT → Dim_Producto..." className={inputCls} />
            </Field>
          </div>
        </section>

        {/* SQL */}
        <section>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-ub-dark text-white text-[9px] flex items-center justify-center">3</span>
            SQL
          </h4>
          <div className="space-y-3">
            <Field label="Schema" note="elegí uno existente o escribí tu propio Setup SQL abajo">
              <div className="flex gap-2 items-center">
                <select
                  value={draft.schemaRef}
                  onChange={e => set('schemaRef', e.target.value)}
                  className={`${inputCls} font-mono text-xs flex-1`}
                >
                  {SCHEMA_KEYS.map(k => (
                    <option key={k} value={k}>{k || '— Setup SQL personalizado —'}</option>
                  ))}
                </select>
                {draft.schemaRef && (
                  <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-lg font-bold whitespace-nowrap">
                    ✓ {draft.schemaRef}
                  </span>
                )}
              </div>
            </Field>
            <Field label="Setup SQL" note={draft.schemaRef ? `opcional — sobreescribe ${draft.schemaRef} si se completa` : 'CREATE TABLE + INSERT — datos de prueba para sql.js'}>
              <textarea value={draft.setupSql} onChange={e => set('setupSql', e.target.value)}
                rows={draft.schemaRef ? 3 : 9} spellCheck={false}
                className={`${codeCls} ${draft.schemaRef ? 'opacity-50' : ''}`}
                placeholder={draft.schemaRef
                  ? `// Dejá vacío para usar SCHEMAS["${draft.schemaRef}"] automáticamente`
                  : `CREATE TABLE Dim_Categoria (id_categoria INTEGER PRIMARY KEY, nombre_cat TEXT);\nINSERT INTO Dim_Categoria VALUES (1,'Electrónica'),(2,'Ropa');\n\nCREATE TABLE FACT_VENTA_FACTURA (...);\nINSERT INTO FACT_VENTA_FACTURA VALUES ...;`
                } />
            </Field>
            <Field label="Consulta de referencia" note="respuesta correcta">
              <textarea value={draft.referenceQuery} onChange={e => set('referenceQuery', e.target.value)}
                rows={7} spellCheck={false} className={codeCls}
                placeholder={`SELECT c.nombre_cat AS categoria, SUM(vf.total_ventas) AS ventas\nFROM FACT_VENTA_FACTURA vf\n  JOIN Dim_Categoria c ON ...\nGROUP BY c.nombre_cat\nORDER BY categoria;`} />
            </Field>
            <Field label="Verify Query" note="opcional — para INSERT/DDL: query de verificación post-ejecución">
              <textarea value={draft.verifyQuery} onChange={e => set('verifyQuery', e.target.value)}
                rows={2} spellCheck={false} className={codeCls}
                placeholder="SELECT * FROM TMP_VENTAS ORDER BY id_venta;" />
            </Field>
          </div>
        </section>
      </div>

      {/* ── Columna derecha: validación + output ── */}
      <div className="space-y-5 overflow-y-auto pl-1" style={{ maxHeight: 'calc(90vh - 120px)' }}>

        {/* Validador */}
        <section>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-ub-dark text-white text-[9px] flex items-center justify-center">4</span>
            Validar (SQLite in-browser)
          </h4>

          <button
            onClick={handleValidate}
            disabled={validating || !canValidate}
            className="w-full py-3 bg-ub-dark hover:bg-ub-mid disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 mb-4"
          >
            {validating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Ejecutando en SQLite...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ejecutar Setup + Query
              </>
            )}
          </button>

          {!validation && !validating && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center text-gray-400 text-xs">
              Completá el setup y la consulta de referencia, luego ejecutá para validar.
            </div>
          )}

          {validation && (
            <div className={`rounded-xl p-4 border ${validation.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {validation.ok ? (
                <>
                  <p className="text-sm font-bold text-green-700 mb-1">
                    ✓ {hasSchema ? (draft.schemaRef && !draft.setupSql.trim() ? `SCHEMAS["${draft.schemaRef}"]` : 'Setup SQL') + ' + query' : 'Query'} ejecutado correctamente
                    {validation.rows && ` — ${validation.rows.length} fila(s)`}
                  </p>
                  {validation.columns && validation.columns.length > 0 && validation.rows && (
                    <SqlResultTable columns={validation.columns} rows={validation.rows} />
                  )}
                  {validation.columns?.length === 0 && (
                    <p className="text-xs text-green-600 mt-1">Query ejecutada sin resultado (INSERT/DDL).</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-red-700 mb-1">✗ Error al ejecutar</p>
                  <pre className="text-xs text-red-600 font-mono whitespace-pre-wrap">{validation.error}</pre>
                </>
              )}
            </div>
          )}
        </section>

        {/* Output JSON */}
        <section>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-ub-dark text-white text-[9px] flex items-center justify-center">5</span>
            JSON generado
          </h4>

          {draft.id && (
            <div className="mb-3 p-3 bg-ub-dark/5 rounded-xl border border-ub-mid/20 flex items-center gap-3">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">ID del ejercicio</p>
                <p className="font-mono text-sm font-black text-ub-dark">{draft.id}</p>
              </div>
              {validation?.ok && (
                <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-lg font-bold">✓ validado</span>
              )}
            </div>
          )}

          <div className="space-y-3">
            <CopyBlock
              label="Para sqlPractices"
              note="Agregar al array en /ejercicios (SQL Training)"
              text={JSON.stringify(practiceObj, null, 2)}
            />
            <CopyBlock
              label="Para sqlExercises del integrador"
              note="Pegar dentro de un array sqlExercises en questions.ts"
              text={JSON.stringify(exerciseObj, null, 2)}
            />
          </div>
        </section>

        {/* Guardar */}
        <section className="pt-4 border-t border-gray-100 space-y-2">
          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">{saveError}</div>
          )}
          <p className="text-[10px] text-gray-400">
            "Guardar en SQL Training" persiste el ejercicio en MongoDB y lo hace visible en <code>/ejercicios</code> de inmediato para todos los usuarios.
          </p>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all"
          >
            {saving ? 'Guardando…' : `+ Guardar "${draft.title || 'ejercicio'}" en SQL Training`}
          </button>
        </section>
      </div>
    </div>
  )
}

// ─── SQL Creator Tab (lista + botón abrir modal) ───────────────────────────────
export default function SqlCreatorSection() {
  const { sqlPractices } = useContext(ContentContext)
  const [open, setOpen] = useState(false)
  const [saveOk, setSaveOk] = useState(false)

  const handleSaved = () => {
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 4000)
  }

  const diffColors: Record<string, string> = {
    facil:      'bg-green-100 text-green-700',
    intermedio: 'bg-blue-100 text-blue-700',
    avanzado:   'bg-amber-100 text-amber-700',
    reto:       'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 max-w-xl">
          Creá ejercicios SQL con validación in-browser (SQLite/sql.js). El ID generado puede embeberse en <code className="bg-gray-100 px-1 rounded text-xs">questions.ts</code> o guardarse directamente en <code className="bg-gray-100 px-1 rounded text-xs">sqlPractices</code> de MongoDB.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-ub-dark hover:bg-ub-mid text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-ub-dark/20 flex-shrink-0 ml-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Ejercicio SQL
        </button>
      </div>

      {saveOk && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
          ✓ Ejercicio guardado. Ya aparece en /ejercicios para todos los usuarios.
        </div>
      )}

      {/* Lista de ejercicios existentes en sqlPractices */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sqlPractices.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-sm text-gray-800 leading-tight">{p.title}</p>
              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${diffColors[p.difficulty] ?? 'bg-gray-100 text-gray-500'}`}>
                {p.difficulty}
              </span>
            </div>
            <p className="font-mono text-[10px] text-gray-400">{p.id}</p>
            {p.setupSql ? (
              <span className="inline-block text-[9px] bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded font-bold">
                ✓ sql.js setup
              </span>
            ) : (
              <span className="inline-block text-[9px] bg-gray-50 text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">
                sin setup
              </span>
            )}
          </div>
        ))}
        {sqlPractices.length === 0 && (
          <div className="col-span-3 text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl text-sm">
            No hay ejercicios SQL creados todavía.
          </div>
        )}
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="SQL Creator"
        maxWidth="max-w-7xl"
      >
        <CreatorModal onClose={() => setOpen(false)} onSaved={handleSaved} />
      </Modal>
    </div>
  )
}
