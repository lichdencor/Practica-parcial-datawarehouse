import { useState, useContext, useMemo } from 'react'
import MultipleChoiceSection from '../components/MultipleChoiceSection'
import DwhDiagram from '../components/DwhDiagram'
import SqlShell from '../components/SqlShell'
import { ContentContext, ProgressContext } from '../App'
import { examSections } from '../data/questions'
import { getIntegradorItems, getLevelInfo, computeXP } from '../utils/gamification'

type Section = (typeof examSections)[0]

function SectionCard({ section }: { section: Section }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="mb-6" id={`section-${section.id}`}>
      <button
        className="w-full text-left bg-ub-dark text-white px-5 py-4 rounded-xl shadow-md flex items-center justify-between hover:bg-ub-mid transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <span className="text-ub-pale text-sm font-medium">{section.title}</span>
          <h2 className="text-base font-bold mt-0.5">{section.subtitle}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            section.type === 'multiple-choice' ? 'bg-blue-400 text-white' :
            section.type === 'dwh-diagram' ? 'bg-purple-400 text-white' :
            'bg-green-400 text-white'
          }`}>
            {section.type === 'multiple-choice' ? 'Opción múltiple' :
             section.type === 'dwh-diagram' ? 'Diagrama DWH' : 'SQL Shell'}
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="mt-3 px-1">
          {section.type === 'multiple-choice' && (
            <MultipleChoiceSection section={section} />
          )}
          {section.type === 'dwh-diagram' && section.diagram && (
            <div>
              {section.theory && (
                <div className="bg-blue-50 border-l-4 border-ub-mid rounded-r-xl p-4 mb-4 text-sm text-gray-700">
                  {section.theory}
                </div>
              )}
              <DwhDiagram diagram={section.diagram} />
            </div>
          )}
          {section.type === 'sql-shell' && section.sqlExercises && (
            <SqlShell exercises={section.sqlExercises} theory={section.theory} />
          )}
          {section.type === 'schema-question' && section.diagram && (
            <div>
              {section.theory && (
                <div className="bg-blue-50 border-l-4 border-ub-mid rounded-r-xl p-4 mb-4 text-sm text-gray-700">
                  {section.theory}
                </div>
              )}
              <DwhDiagram diagram={section.diagram} />
              {section.questions && section.questions.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Preguntas sobre el esquema</p>
                  <MultipleChoiceSection section={section} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ResultsPanelProps {
  questions: Section[]
  onClose: () => void
}

function ResultsPanel({ questions, onClose }: ResultsPanelProps) {
  const { progress } = useContext(ProgressContext)

  let mcTotal = 0, mcCorrect = 0
  let sqlTotal = 0, sqlAttempted = 0

  for (const section of questions) {
    if (section.type === 'multiple-choice' && section.questions) {
      for (const q of section.questions) {
        mcTotal++
        const correct = q.choices.find(c => c.correct)?.id
        if (progress[q.id] === correct) mcCorrect++
      }
    } else if (section.type === 'sql-shell' && section.sqlExercises) {
      for (const ex of section.sqlExercises) {
        sqlTotal++
        if (progress[ex.id]) sqlAttempted++
      }
    }
  }

  const xp = computeXP(progress)
  const levelInfo = getLevelInfo(xp)
  const mcPct = mcTotal > 0 ? Math.round((mcCorrect / mcTotal) * 100) : 0
  const specialTitle = `x${questions.length} Data Engineer`

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Trophy header */}
        <div className="bg-ub-dark px-6 py-6 text-center">
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="text-2xl font-black text-white">¡Integrador Completado!</h2>
          <p className="text-ub-pale/70 text-sm mt-1">Título desbloqueado</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-amber-400 text-amber-900 px-5 py-2 rounded-xl text-base font-black shadow-lg">
            🏆 {specialTitle}
          </div>
        </div>

        <div className="p-6 space-y-3">
          {/* MC score */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Opción Múltiple</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-black text-ub-dark">{mcCorrect}</span>
              <span className="text-lg text-gray-400 font-bold mb-0.5">/ {mcTotal} correctas</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${mcPct >= 70 ? 'bg-green-400' : mcPct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${mcPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{mcPct}% de acierto</p>
          </div>

          {/* SQL score */}
          {sqlTotal > 0 && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">SQL Shell</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-black text-ub-dark">{sqlAttempted}</span>
                <span className="text-lg text-gray-400 font-bold mb-0.5">/ {sqlTotal} intentadas</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full transition-all duration-700"
                  style={{ width: sqlTotal > 0 ? `${Math.round((sqlAttempted / sqlTotal) * 100)}%` : '0%' }}
                />
              </div>
            </div>
          )}

          {/* Level */}
          <div className="bg-ub-pale rounded-2xl p-4 flex items-center gap-3">
            <span className="text-3xl">{levelInfo.emoji}</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tu nivel actual</p>
              <p className="font-black text-ub-dark">{levelInfo.title}</p>
              <p className="text-xs text-gray-500">{levelInfo.xp} XP · Nivel {levelInfo.level}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-ub-dark hover:bg-ub-mid text-white py-3 rounded-xl font-black transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Integrador() {
  const { questions } = useContext(ContentContext)
  const { progress, saveProgress } = useContext(ProgressContext)
  const [showResults, setShowResults] = useState(false)

  const integradorItems = useMemo(() => getIntegradorItems(questions), [questions])
  const answeredCount = integradorItems.filter(id => !!progress[id]).length
  const totalCount = integradorItems.length
  const allDone = totalCount > 0 && answeredCount >= totalCount
  const alreadyFinalized = progress['_integrador_complete'] === true
  const pct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0

  const handleFinalize = () => {
    saveProgress('_integrador_complete', true)
    setShowResults(true)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {showResults && (
        <ResultsPanel
          questions={questions as Section[]}
          onClose={() => setShowResults(false)}
        />
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ub-dark">Modelo Integrador</h2>
        <p className="text-gray-500 text-sm">Simulacro completo del parcial 2022 con todas las secciones correlativas.</p>
      </div>

      {/* Progress tracker */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
        <div className="flex items-center justify-between mb-3 gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Progreso del Simulacro</p>
            <p className="text-sm font-bold text-ub-dark mt-0.5">
              {answeredCount} / {totalCount} respondidos
              <span className="text-gray-400 font-normal ml-1">({pct}%)</span>
            </p>
          </div>
          {allDone && (
            <button
              onClick={alreadyFinalized ? () => setShowResults(true) : handleFinalize}
              className="flex-shrink-0 bg-ub-dark hover:bg-ub-mid text-white px-4 py-2 rounded-xl text-sm font-black transition-colors flex items-center gap-2 shadow-md shadow-ub-dark/20"
            >
              {alreadyFinalized ? '🏆 Ver Resultados' : '✓ Finalizar Simulacro'}
            </button>
          )}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'bg-gradient-to-r from-ub-light to-ub-mid'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Quick nav */}
        <div className="mt-3 flex flex-wrap gap-2">
          {questions.map(s => (
            <a
              key={s.id}
              href={`#section-${s.id}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                s.type === 'multiple-choice' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                s.type === 'dwh-diagram' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' :
                'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {questions.map(section => (
        <SectionCard key={section.id} section={section as Section} />
      ))}
    </div>
  )
}
