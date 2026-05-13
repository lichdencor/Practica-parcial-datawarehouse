import { useState, useContext } from 'react'
import MultipleChoiceSection from '../components/MultipleChoiceSection'
import DwhDiagram from '../components/DwhDiagram'
import SqlShell from '../components/SqlShell'
import { ContentContext } from '../App'
import { examSections } from '../data/questions'

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
        </div>
      )}
    </div>
  )
}

export default function Integrador() {
  const { questions } = useContext(ContentContext)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-ub-dark">Modelo Integrador</h2>
        <p className="text-gray-500 text-sm">Simulacro completo del parcial 2022 con todas las secciones correlativas.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Navegación rápida</p>
        <div className="flex flex-wrap gap-2">
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
