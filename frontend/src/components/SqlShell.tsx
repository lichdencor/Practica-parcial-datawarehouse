import { useState, useEffect, useContext } from 'react'
import type { SqlExercise } from '../data/questions'
import { ProgressContext } from '../App'

// --- sql.js loader (singleton, carga el WASM una sola vez) ---
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

// --- Helpers ---

function stripUseStatements(sql: string): string {
  return sql.replace(/\bUSE\s+\S+\s*;?\s*/gi, '').trim()
}

type SqlValue = string | number | null | Uint8Array
type SqlRow = SqlValue[]
interface ExecResult { columns: string[]; values: SqlRow[] }

function normalizeValue(v: SqlValue): string {
  if (v === null || v === undefined) return 'NULL'
  if (v instanceof Uint8Array) return Array.from(v).join(',')
  const n = typeof v === 'number' ? v : Number(v)
  if (!isNaN(n)) return n.toString()
  return String(v).trim().toLowerCase()
}

function rowKey(row: SqlRow): string {
  return row.map(normalizeValue).join('\x00')
}

function compareResults(
  userRes: ExecResult | null,
  refRes: ExecResult | null,
): { match: boolean; reason?: string } {
  if (!userRes && !refRes) return { match: true }
  if (!userRes) return { match: false, reason: 'Tu consulta no devolvió ningún resultado.' }
  if (!refRes)  return { match: false, reason: 'Error interno ejecutando la referencia.' }

  if (userRes.values.length !== refRes.values.length) {
    return {
      match: false,
      reason: `Tu consulta devuelve ${userRes.values.length} fila(s), se esperan ${refRes.values.length}.`,
    }
  }

  const userSorted = [...userRes.values].map(rowKey).sort()
  const refSorted  = [...refRes.values].map(rowKey).sort()

  for (let i = 0; i < userSorted.length; i++) {
    if (userSorted[i] !== refSorted[i]) {
      return { match: false, reason: 'Los valores de tu consulta no coinciden con los esperados.' }
    }
  }
  return { match: true }
}

// --- Parser de schema para mostrar tablas disponibles ---
interface TableInfo { name: string; columns: string[] }
function parseSetupTables(setupSql: string): TableInfo[] {
  const tables: TableInfo[] = []
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([^;]+?)\)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(setupSql)) !== null) {
    const name = m[1]
    const cols = m[2]
      .split(',')
      .map(c => c.trim().split(/\s+/)[0])
      .filter(c => c && !/^(FOREIGN|PRIMARY|UNIQUE|CHECK|CONSTRAINT)$/i.test(c))
    tables.push({ name, columns: cols })
  }
  return tables
}

// --- Estado de ejecución ---
interface ExecState {
  loading: boolean
  sqlError?: string
  userResult?: ExecResult
  match?: boolean
  matchReason?: string
}

// --- Tabla de resultados ---
function ResultTable({ result }: { result: ExecResult }) {
  const MAX_ROWS = 15
  const rows = result.values.slice(0, MAX_ROWS)
  if (result.columns.length === 0) {
    return <p className="text-xs text-gray-400 italic mt-1">Consulta ejecutada sin resultados.</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700 mt-2">
      <table className="text-xs font-mono w-full">
        <thead>
          <tr className="bg-gray-700">
            {result.columns.map(c => (
              <th key={c} className="px-3 py-1.5 text-left text-gray-300 font-semibold whitespace-nowrap border-r border-gray-600 last:border-r-0">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
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
      {result.values.length > MAX_ROWS && (
        <p className="text-[10px] text-gray-500 px-3 py-1 bg-gray-900 border-t border-gray-700">
          Mostrando {MAX_ROWS} de {result.values.length} filas.
        </p>
      )}
    </div>
  )
}

// --- Componente principal de cada ejercicio ---
function ExerciseShell({ exercise }: { exercise: SqlExercise }) {
  const { progress, saveProgress } = useContext(ProgressContext)
  const [sql, setSql] = useState('')
  const [exec, setExec] = useState<ExecState>({ loading: false })
  const [showRef, setShowRef] = useState(false)
  const [showSchema, setShowSchema] = useState(false)

  useEffect(() => {
    if (progress[exercise.id]) setSql(progress[exercise.id])
  }, [progress, exercise.id])

  const handleRun = async () => {
    const trimmed = sql.trim()
    if (!trimmed) {
      setExec({ loading: false, sqlError: 'La consulta no puede estar vacía.' })
      return
    }
    setExec({ loading: true })
    saveProgress(exercise.id, sql)

    try {
      const SQL = await getSql()
      const userSql = stripUseStatements(trimmed)
      const refSql  = stripUseStatements(exercise.referenceQuery)

      const isSelectLike = (s: string) => /^\s*(SELECT|WITH)\b/i.test(s)

      const runOnDb = (setupSql: string | undefined, querySql: string, verifyQuery?: string): ExecResult | null => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db: any = new SQL.Database()
        if (setupSql) db.run(setupSql)
        if (isSelectLike(querySql)) {
          const res = db.exec(querySql)
          db.close()
          return res[0] ?? { columns: [], values: [] }
        } else {
          db.run(querySql)
          if (verifyQuery) {
            const res = db.exec(verifyQuery)
            db.close()
            return res[0] ?? { columns: [], values: [] }
          }
          db.close()
          return { columns: [], values: [] }
        }
      }

      const userResult = runOnDb(exercise.setupSql, userSql, exercise.verifyQuery)
      const refResult  = runOnDb(exercise.setupSql, refSql,  exercise.verifyQuery)

      const { match, reason } = compareResults(userResult, refResult)

      setExec({
        loading: false,
        userResult: userResult ?? undefined,
        match,
        matchReason: reason,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setExec({ loading: false, sqlError: msg })
    }
  }

  const handleClear = () => {
    setSql('')
    setExec({ loading: false })
    setShowRef(false)
  }

  const hasSetup = !!exercise.setupSql
  const schemaTables = hasSetup ? parseSetupTables(exercise.setupSql!) : []

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5 overflow-hidden">
      {/* Header */}
      <div className="bg-ub-dark text-white px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-bold text-sm">{exercise.metric}</h4>
            <p className="text-ub-pale text-xs opacity-80 mt-0.5">{exercise.description}</p>
          </div>
          {hasSetup && (
            <span className="shrink-0 text-[10px] bg-green-700/60 text-green-200 px-2 py-0.5 rounded-full font-mono">
              ejecución real
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {exercise.dimensions.map(d => (
            <span key={d} className="bg-ub-mid text-white text-xs px-2 py-0.5 rounded-full font-mono">
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Hint */}
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 text-xs text-amber-800">
        <strong>Pista:</strong> {exercise.hint}
      </div>

      {/* Schema panel */}
      {hasSetup && schemaTables.length > 0 && (
        <div className="border-b border-gray-100">
          <button
            onClick={() => setShowSchema(s => !s)}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            <svg className={`w-3 h-3 transition-transform ${showSchema ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 4.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L10.586 9 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Tablas disponibles en esta BD</span>
            <span className="text-indigo-400 font-mono">{schemaTables.map(t => t.name).join(', ')}</span>
          </button>
          {showSchema && (
            <div className="bg-gray-950 px-4 py-3 flex flex-wrap gap-4">
              {schemaTables.map(t => (
                <div key={t.name} className="font-mono text-[11px]">
                  <p className="text-yellow-400 font-bold mb-1">{t.name}</p>
                  {t.columns.map(c => (
                    <p key={c} className="text-gray-400 pl-2">· {c}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      <div className="p-4">
        <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-t-lg text-xs text-gray-400">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="ml-2">SQL Shell</span>
          <span className="ml-auto italic">{hasSetup ? 'SQLite (datos de prueba)' : 'sin ejecución'}</span>
        </div>

        <textarea
          value={sql}
          onChange={e => setSql(e.target.value)}
          spellCheck={false}
          className="sql-editor w-full bg-gray-900 text-green-300 px-4 py-3 rounded-b-lg border-0 outline-none min-h-[160px]"
          placeholder={`-- ${exercise.metric}\n-- Escribí tu consulta SQL aquí...\n\nSELECT ...`}
        />

        <div className="flex gap-2 mt-2">
          <button
            onClick={handleRun}
            disabled={exec.loading}
            className="bg-ub-mid hover:bg-ub-dark disabled:opacity-60 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {exec.loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Ejecutando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Ejecutar / Validar
              </>
            )}
          </button>
          <button
            onClick={handleClear}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            Limpiar
          </button>
          <button
            onClick={() => setShowRef(s => !s)}
            className="ml-auto bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            {showRef ? 'Ocultar respuesta' : 'Ver respuesta'}
          </button>
        </div>

        {/* Error de SQL */}
        {exec.sqlError && (
          <div className="mt-3 rounded-lg p-3 bg-red-50 border border-red-200 text-sm">
            <p className="font-semibold text-red-700 mb-1">✗ Error al ejecutar</p>
            <pre className="text-red-600 text-xs font-mono whitespace-pre-wrap">{exec.sqlError}</pre>
          </div>
        )}

        {/* Resultado + comparación */}
        {!exec.loading && !exec.sqlError && exec.userResult !== undefined && (
          <div className="mt-3 space-y-2">
            {/* Tabla de resultados */}
            {exec.userResult.columns.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Resultado de tu consulta
                </p>
                <ResultTable result={exec.userResult} />
              </div>
            )}

            {/* Badge de comparación */}
            {exec.match !== undefined && (
              <div className={`rounded-lg p-3 text-sm border flex items-start gap-2 ${
                exec.match
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <span className={`text-lg leading-none ${exec.match ? 'text-green-600' : 'text-red-600'}`}>
                  {exec.match ? '✓' : '✗'}
                </span>
                <div>
                  <p className={`font-semibold text-sm ${exec.match ? 'text-green-700' : 'text-red-700'}`}>
                    {exec.match
                      ? 'Correcto — el resultado coincide con la referencia'
                      : 'Incorrecto — el resultado no coincide con la referencia'}
                  </p>
                  {exec.matchReason && (
                    <p className="text-xs mt-0.5 text-red-600">{exec.matchReason}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Consulta de referencia */}
        {showRef && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Consulta de referencia
            </p>
            <pre className="bg-gray-900 text-green-300 text-xs font-mono p-3 rounded-lg overflow-x-auto whitespace-pre">
              {exercise.referenceQuery}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

interface SqlShellProps {
  exercises: SqlExercise[]
  theory?: string
}

export default function SqlShell({ exercises, theory }: SqlShellProps) {
  return (
    <div>
      {theory && (
        <div className="bg-blue-50 border-l-4 border-ub-mid rounded-r-xl p-4 mb-5 text-sm text-gray-700">
          {theory}
        </div>
      )}
      {exercises.map(ex => (
        <ExerciseShell key={ex.id} exercise={ex} />
      ))}
    </div>
  )
}
