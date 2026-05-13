import { useState, useContext } from 'react'
import { ProgressContext, ContentContext } from '../App'
import type { QuickPractice } from '../data/practice_quick'

function PracticeCard({ item }: { item: QuickPractice }) {
  const { progress, saveProgress } = useContext(ProgressContext)
  const [selected, setSelected] = useState<'fact' | 'dimension' | null>(progress[item.id] || null)
  const [showFeedback, setShowExplanation] = useState(!!progress[item.id])

  const handleSelect = (type: 'fact' | 'dimension') => {
    if (selected) return
    setSelected(type)
    setShowExplanation(true)
    saveProgress(item.id, type)
  }

  const isCorrect = selected === item.correctType

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Identificar Tabla</span>
          <h3 className="text-xl font-bold text-ub-dark mt-1 font-mono bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
            {item.tableName}
          </h3>
        </div>
        {showFeedback && (
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isCorrect ? '✓ CORRECTO' : '✗ INCORRECTO'}
          </div>
        )}
      </div>

      <div className="mb-8">
        <p className="text-xs font-bold text-gray-400 uppercase mb-3">Atributos / Columnas</p>
        <div className="flex flex-wrap gap-2">
          {item.columns.map(col => (
            <span key={col} className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono text-[11px] border border-gray-200">
              {col}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleSelect('fact')}
          className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
            selected === 'fact'
              ? (isCorrect ? 'bg-green-500 border-green-600 text-white shadow-lg' : 'bg-red-500 border-red-600 text-white')
              : 'bg-white border-gray-200 text-gray-600 hover:border-ub-mid hover:text-ub-mid'
          }`}
        >
          Es una FACT
        </button>
        <button
          onClick={() => handleSelect('dimension')}
          className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
            selected === 'dimension'
              ? (isCorrect ? 'bg-green-500 border-green-600 text-white shadow-lg' : 'bg-red-500 border-red-600 text-white')
              : 'bg-white border-gray-200 text-gray-600 hover:border-ub-mid hover:text-ub-mid'
          }`}
        >
          Es una DIMENSION
        </button>
      </div>

      {showFeedback && (
        <div className={`mt-6 p-4 rounded-xl text-sm ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <strong>{isCorrect ? '¡Bien hecho! ' : 'Ops... '}</strong>
          {item.explanation}
        </div>
      )}
    </div>
  )
}

export default function Practica() {
  const { quickPractice } = useContext(ContentContext)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black text-ub-dark">Práctica Rápida</h2>
        <p className="text-gray-500 mt-2">Pon a prueba tu instinto analítico. ¿Sabes diferenciar un hecho de una dimensión?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {quickPractice.map(item => (
          <PracticeCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
