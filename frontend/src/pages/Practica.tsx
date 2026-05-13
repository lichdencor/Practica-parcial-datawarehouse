import { useState, useContext, useMemo } from 'react'
import { ProgressContext, ContentContext } from '../App'
import type { QuickPractice } from '../data/practice_quick'

// --- Flashcard Component ---

function FlashcardCarousel({ items }: { items: QuickPractice[] }) {
  const { progress, saveProgress } = useContext(ProgressContext)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  // Seleccionar 5 aleatorias (o todas si son menos de 5)
  const flashcards = useMemo(() => {
    return [...items].sort(() => 0.5 - Math.random()).slice(0, 5)
  }, [items])

  if (flashcards.length === 0) return null

  const current = flashcards[index]
  const isLearned = !!progress[current.id]

  const next = () => {
    setFlipped(false)
    setIndex((index + 1) % flashcards.length)
  }

  const prev = () => {
    setFlipped(false)
    setIndex((index - 1 + flashcards.length) % flashcards.length)
  }

  const toggleLearned = (e: React.MouseEvent) => {
    e.stopPropagation()
    saveProgress(current.id, !isLearned)
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-ub-dark uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          Flashcards de Repaso
        </h3>
        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {index + 1} / {flashcards.length}
        </span>
      </div>

      <div className="relative perspective-1000 h-64 w-full max-w-lg mx-auto">
        <div 
          onClick={() => setFlipped(!flipped)}
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer ${flipped ? 'rotate-y-180' : ''}`}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-ub-dark text-white rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl border-4 border-ub-mid/20">
            <span className="text-[10px] font-bold text-ub-pale/40 uppercase mb-4 tracking-tighter">¿Qué es...?</span>
            <h4 className="text-2xl font-black">{current.front}</h4>
            <p className="text-[10px] mt-8 text-ub-pale/50 animate-pulse italic">Click para ver respuesta</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-white text-ub-dark rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl border-4 border-ub-mid/20 rotate-y-180">
            <h4 className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">{current.front}</h4>
            <p className="text-lg font-medium leading-relaxed">{current.back}</p>
            
            <button
              onClick={toggleLearned}
              className={`mt-6 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isLearned ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isLearned ? 'Ya lo sé' : 'Marcar como aprendido'}
            </button>
          </div>
        </div>

        <button onClick={prev} className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg border border-gray-100 text-ub-dark hover:scale-110 transition-transform">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={next} className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg border border-gray-100 text-ub-dark hover:scale-110 transition-transform">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  )
}

// --- Fact/Dimension Card ---

function FactDimensionCard({ item }: { item: QuickPractice }) {
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
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
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
          {(item.columns || []).map(col => (
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
          {item.explanation}
        </div>
      )}
    </div>
  )
}

// --- Multiple Choice Card ---

function PracticeMCCard({ item }: { item: QuickPractice }) {
  const { progress, saveProgress } = useContext(ProgressContext)
  const [selected, setSelected] = useState<string | null>(progress[item.id] || null)
  const [showFeedback, setShowFeedback] = useState(!!progress[item.id])

  const handleSelect = (choiceId: string) => {
    if (selected) return
    setSelected(choiceId)
    setShowFeedback(true)
    saveProgress(item.id, choiceId)
  }

  const correctChoice = item.choices?.find(c => c.correct)
  const isCorrect = selected === correctChoice?.id

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col">
      <div className="mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pregunta de Práctica</span>
        <h3 className="text-lg font-bold text-ub-dark mt-1 leading-tight">{item.question}</h3>
      </div>

      <div className="space-y-3 mb-6 flex-1">
        {item.choices?.map(choice => (
          <button
            key={choice.id}
            onClick={() => handleSelect(choice.id)}
            disabled={!!selected}
            className={`w-full text-left p-4 rounded-xl text-sm border-2 transition-all font-medium ${
              selected === choice.id
                ? (choice.correct ? 'bg-green-500 border-green-600 text-white' : 'bg-red-500 border-red-600 text-white')
                : (selected && choice.correct ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-100 hover:border-ub-mid')
            }`}
          >
            {choice.text}
          </button>
        ))}
      </div>

      {showFeedback && (
        <div className={`p-4 rounded-xl text-xs ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {item.explanation}
        </div>
      )}
    </div>
  )
}

// --- Theory/Question Card ---

function PracticeTheoryCard({ item }: { item: QuickPractice }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col">
      <div className="mb-6">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pregunta Teórica</span>
        <h3 className="text-lg font-bold text-ub-dark mt-1 leading-tight">{item.question}</h3>
      </div>

      {!revealed ? (
        <button 
          onClick={() => setRevealed(true)}
          className="w-full py-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-400 text-xs font-bold hover:bg-gray-100 transition-all flex flex-col items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          Revelar Respuesta
        </button>
      ) : (
        <div className="flex-1">
          <div className="p-4 bg-amber-50 rounded-xl text-sm text-amber-900 border border-amber-100 leading-relaxed italic mb-4">
            {item.explanation}
          </div>
          <button 
            onClick={() => setRevealed(false)}
            className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-ub-dark transition-colors"
          >
            Ocultar
          </button>
        </div>
      )}
    </div>
  )
}

// --- Main Page ---

const TYPE_CONFIG: Record<string, { title: string; subtitle: string; icon: React.ReactNode }> = {
  'fact-dimension': {
    title: 'Hechos vs Dimensiones',
    subtitle: 'Identifica el tipo de tabla según sus atributos y propósito.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  },
  'multiple-choice': {
    title: 'Selección Múltiple',
    subtitle: 'Pon a prueba tus conocimientos con preguntas de opción múltiple.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    )
  },
  'theory': {
    title: 'Preguntas Teóricas',
    subtitle: 'Explica conceptos fundamentales del Data Warehousing.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  }
}

export default function Practica() {
  const { quickPractice } = useContext(ContentContext)

  const groups = useMemo(() => {
    return quickPractice.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item)
      return acc
    }, {} as Record<string, QuickPractice[]>)
  }, [quickPractice])

  const flashcards = groups['flashcard'] || []
  const typesOrdered = ['fact-dimension', 'multiple-choice', 'theory']

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-20">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-4xl font-black text-ub-dark tracking-tight">Entrenamiento DWH</h2>
        <p className="text-gray-500 mt-4 text-lg">
          Un espacio interactivo para dominar los conceptos de Data Warehousing mediante la práctica activa.
        </p>
      </div>

      {flashcards.length > 0 && (
        <section>
          <FlashcardCarousel items={flashcards} />
        </section>
      )}

      {typesOrdered.map(type => {
        const items = groups[type]
        if (!items || items.length === 0) return null
        const config = TYPE_CONFIG[type]

        return (
          <section key={type} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
              <div className="p-3 bg-ub-mid/10 text-ub-mid rounded-2xl">
                {config.icon}
              </div>
              <div>
                <h3 className="text-2xl font-black text-ub-dark tracking-tight">{config.title}</h3>
                <p className="text-gray-500 text-sm font-medium">{config.subtitle}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {items.map(item => {
                if (item.type === 'multiple-choice') return <PracticeMCCard key={item.id} item={item} />
                if (item.type === 'theory') return <PracticeTheoryCard key={item.id} item={item} />
                if (item.type === 'fact-dimension') return <FactDimensionCard key={item.id} item={item} />
                return null
              })}
            </div>
          </section>
        )
      })}

      {quickPractice.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">No hay ejercicios disponibles en este momento.</p>
        </div>
      )}
    </div>
  )
}
