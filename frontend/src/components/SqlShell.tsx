import { useState, useEffect, useContext } from 'react'
import type { SqlExercise } from '../data/questions'
import { ProgressContext } from '../App'

interface SqlResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

function checkSql(sql: string): SqlResult {
  const errors: string[] = []
  const warnings: string[] = []
  const trimmed = sql.trim()

  if (!trimmed) {
    return { valid: false, errors: ['La consulta no puede estar vacía.'], warnings: [] }
  }

  const upper = trimmed.toUpperCase()

  // Must start with valid keyword
  if (!/^(SELECT|WITH|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/.test(upper)) {
    errors.push('La consulta debe comenzar con una palabra clave SQL válida (SELECT, WITH, INSERT, etc.)')
  }

  // Balanced parentheses
  let depth = 0
  for (const ch of trimmed) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (depth < 0) { errors.push('Paréntesis de cierre sin apertura previa.'); break }
  }
  if (depth > 0) errors.push(`Hay ${depth} paréntesis sin cerrar.`)

  // SELECT without FROM
  if (/\bSELECT\b/i.test(trimmed) && !/\bFROM\b/i.test(trimmed)) {
    errors.push('Un SELECT requiere una cláusula FROM.')
  }

  // JOIN sin ON
  const joinCount = (trimmed.match(/\b(INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|JOIN)\b/gi) || []).length
  const onCount = (trimmed.match(/\bON\b/gi) || []).length
  if (joinCount > 0 && onCount < joinCount) {
    errors.push(`Hay ${joinCount} JOIN(s) pero solo ${onCount} cláusula(s) ON. Verificá que cada JOIN tenga su condición ON.`)
  }

  // GROUP BY sin SELECT con agregación
  if (/\bGROUP\s+BY\b/i.test(trimmed)) {
    if (!/\b(SUM|COUNT|AVG|MAX|MIN)\s*\(/i.test(trimmed)) {
      warnings.push('Usás GROUP BY pero no hay funciones de agregación (SUM, COUNT, AVG, MAX, MIN). ¿Es intencional?')
    }
  }

  // ORDER BY referencia a alias o columna
  if (/\bORDER\s+BY\b/i.test(trimmed) && !/\bSELECT\b/i.test(trimmed)) {
    errors.push('ORDER BY sin SELECT.')
  }

  // Terminación con punto y coma (recomendado)
  if (!trimmed.endsWith(';')) {
    warnings.push('Se recomienda terminar la consulta con punto y coma (;).')
  }

  return { valid: errors.length === 0, errors, warnings }
}

function ExerciseShell({ exercise }: { exercise: SqlExercise }) {
  const { progress, saveProgress } = useContext(ProgressContext)
  const [sql, setSql] = useState('')
  const [result, setResult] = useState<SqlResult | null>(null)
  const [showRef, setShowRef] = useState(false)

  useEffect(() => {
    if (progress[exercise.id]) {
      setSql(progress[exercise.id])
    }
  }, [progress, exercise.id])

  const handleRun = () => {
    setResult(checkSql(sql))
    saveProgress(exercise.id, sql)
  }

  const handleClear = () => {
    setSql('')
    setResult(null)
    setShowRef(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5 overflow-hidden">
      {/* Header */}
      <div className="bg-ub-dark text-white px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-bold text-sm">{exercise.metric}</h4>
            <p className="text-ub-pale text-xs opacity-80 mt-0.5">{exercise.description}</p>
          </div>
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

      {/* Editor area */}
      <div className="p-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-t-lg text-xs text-gray-400">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="ml-2">SQL Shell</span>
          <span className="ml-auto italic">PostgreSQL compatible</span>
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
            className="bg-ub-mid hover:bg-ub-dark text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Ejecutar / Validar
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

        {/* Validation result */}
        {result && (
          <div className={`mt-3 rounded-lg p-3 text-sm ${result.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className={`font-semibold mb-1 ${result.valid ? 'text-green-700' : 'text-red-700'}`}>
              {result.valid ? '✓ Sintaxis correcta' : '✗ Errores de sintaxis'}
            </div>
            {result.errors.map((e, i) => (
              <p key={i} className="text-red-700 text-xs">• {e}</p>
            ))}
            {result.warnings.map((w, i) => (
              <p key={i} className="text-amber-700 text-xs">⚠ {w}</p>
            ))}
            {result.valid && (
              <p className="text-green-600 text-xs">
                La consulta tiene estructura SQL válida.
                {result.warnings.length === 0
                  ? ' Sin advertencias.'
                  : ` (${result.warnings.length} advertencia(s) menor(es))`}
              </p>
            )}
          </div>
        )}

        {/* Reference answer */}
        {showRef && (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Consulta de referencia</p>
            </div>
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
