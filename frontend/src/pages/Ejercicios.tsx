import { useContext, useState } from 'react'
import { ContentContext, ProgressContext } from '../App'
import SqlShell from '../components/SqlShell'

export default function Ejercicios() {
  const { sqlPractices } = useContext(ContentContext)
  const { progress } = useContext(ProgressContext)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedPractice = sqlPractices.find(p => p.id === selectedId)

  // Map SqlPractice to SqlExercise for SqlShell compatibility
  const mappedExercise = selectedPractice ? {
    id: selectedPractice.id,
    metric: selectedPractice.title,
    description: selectedPractice.objective,
    dimensions: [selectedPractice.difficulty.toUpperCase()],
    hint: selectedPractice.hint,
    referenceQuery: selectedPractice.referenceQuery,
    setupSql: selectedPractice.setupSql,
    verifyQuery: selectedPractice.verifyQuery,
  } : null

  const difficultyColors = {
    facil: 'bg-green-100 text-green-700 border-green-200',
    intermedio: 'bg-blue-100 text-blue-700 border-blue-200',
    avanzado: 'bg-amber-100 text-amber-700 border-amber-200',
    reto: 'bg-purple-100 text-purple-700 border-purple-200',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-ub-dark rounded-xl flex items-center justify-center text-white shadow-lg shadow-ub-dark/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-ub-dark">SQL Training Module</h2>
        </div>
        <p className="text-gray-500">Domina SQL para Data Warehousing: desde inserciones básicas hasta el modelado de hechos y dimensiones.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Sidebar: List of Exercises */}
        <div className="lg:col-span-1 flex flex-col gap-4 sticky top-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">Ruta de aprendizaje</h3>
          <div className="overflow-y-auto max-h-[calc(100vh-320px)] space-y-2 pr-1">
            {sqlPractices.map((p, idx) => {
              const isCompleted = progress[p.id]
              const isSelected = selectedId === p.id
              
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                    isSelected 
                      ? 'bg-ub-dark border-ub-dark text-white shadow-xl shadow-ub-dark/20 translate-x-1' 
                      : 'bg-white border-gray-200 hover:border-ub-mid/50 hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'text-ub-pale' : 'text-gray-400'}`}>
                      Paso {idx + 1}
                    </span>
                    {isCompleted && (
                      <span className="bg-green-500 text-white rounded-full p-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm leading-tight">{p.title}</h4>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border w-fit uppercase ${
                    isSelected ? 'bg-white/20 border-white/20 text-white' : difficultyColors[p.difficulty]
                  }`}>
                    {p.difficulty}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main: Exercise Content */}
        <div className="lg:col-span-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          {selectedPractice && mappedExercise ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-black text-ub-dark">{selectedPractice.title}</h3>
                  <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase border ${difficultyColors[selectedPractice.difficulty]}`}>
                    {selectedPractice.difficulty}
                  </span>
                </div>
                
                <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 italic">
                    {selectedPractice.description}
                  </div>
                  
                  <div>
                    <h5 className="font-black text-ub-dark text-xs uppercase tracking-widest mb-2">Objetivo del ejercicio</h5>
                    <p className="bg-ub-pale/10 p-4 rounded-2xl border border-ub-pale/20 text-ub-dark font-medium">
                      {selectedPractice.objective}
                    </p>
                  </div>

                  {selectedPractice.schema && (
                    <div>
                      <h5 className="font-black text-ub-dark text-xs uppercase tracking-widest mb-2">Esquema de referencia</h5>
                      <pre className="bg-gray-900 text-blue-300 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto">
                        {selectedPractice.schema}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <SqlShell exercises={[mappedExercise]} />
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-400">Seleccioná una práctica</h3>
              <p className="text-gray-400 text-sm mt-2 max-w-xs">Elegí un ejercicio de la izquierda para comenzar tu entrenamiento en SQL para DWH.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
