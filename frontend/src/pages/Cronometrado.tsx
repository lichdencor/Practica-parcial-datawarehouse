import { useState, useContext, useMemo, useEffect, useRef } from 'react'
import { ContentContext, ProgressContext } from '../App'
import type { Question } from '../data/questions'

type Phase = 'config' | 'exam' | 'results'

interface QuizQuestion extends Question {
  sectionTitle: string
}

interface ExamResult {
  score: number
  total: number
  timeSpent: number
  date: string
  answers: Record<string, string>
}

const TIME_OPTIONS = [
  { label: '3 min', value: 3 },
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
]
const COUNT_OPTIONS = [5, 10, 15]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function Cronometrado() {
  const { questions } = useContext(ContentContext)
  const { saveProgress } = useContext(ProgressContext)

  const [phase, setPhase] = useState<Phase>('config')
  const [timeMinutes, setTimeMinutes] = useState(5)
  const [questionCount, setQuestionCount] = useState(10)
  const [pool, setPool] = useState<QuizQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [result, setResult] = useState<ExamResult | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const allMC: QuizQuestion[] = useMemo(() =>
    questions.flatMap(s =>
      s.type === 'multiple-choice' && s.questions
        ? s.questions.map(q => ({ ...q, sectionTitle: s.subtitle || s.title }))
        : []
    ), [questions])

  const startExam = () => {
    const shuffled = shuffle(allMC).slice(0, Math.min(questionCount, allMC.length))
    setPool(shuffled)
    setCurrentIdx(0)
    setAnswers({})
    setSecondsLeft(timeMinutes * 60)
    setPhase('exam')
  }

  useEffect(() => {
    if (phase !== 'exam') return
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          finalize({})
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const finalize = (currentAnswers: Record<string, string>) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const timeSpent = timeMinutes * 60 - secondsLeft
    const score = pool.reduce((acc, q) => {
      const correct = q.choices.find(c => c.correct)?.id
      return currentAnswers[q.id] === correct ? acc + 1 : acc
    }, 0)
    const res: ExamResult = {
      score,
      total: pool.length,
      timeSpent,
      date: new Date().toISOString(),
      answers: currentAnswers,
    }
    setResult(res)
    saveProgress('_last_timed_exam', { score, total: pool.length, timeSpent, date: res.date })
    setPhase('results')
  }

  const handleAnswer = (questionId: string, choiceId: string) => {
    const newAnswers = { ...answers, [questionId]: choiceId }
    setAnswers(newAnswers)
    if (currentIdx < pool.length - 1) {
      setTimeout(() => setCurrentIdx(i => i + 1), 400)
    } else {
      setTimeout(() => finalize(newAnswers), 400)
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const pct = pool.length > 0 ? Math.round(((currentIdx) / pool.length) * 100) : 0
  const timerUrgent = secondsLeft <= 60 && phase === 'exam'

  // ── CONFIG ──────────────────────────────────────────────────────────────────
  if (phase === 'config') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-ub-dark rounded-2xl flex items-center justify-center text-white shadow-xl shadow-ub-dark/20 mx-auto mb-4">
            <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-ub-dark">Cronometrado</h2>
          <p className="text-gray-500 mt-2">Repaso rápido contra el reloj. Sin pistas, sin explicaciones — solo vos y las preguntas.</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Cantidad de preguntas</p>
            <div className="flex gap-3">
              {COUNT_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`flex-1 py-3 rounded-xl font-black text-lg border-2 transition-all ${questionCount === n ? 'bg-ub-dark text-white border-ub-dark shadow-lg shadow-ub-dark/20' : 'border-gray-200 text-gray-500 hover:border-ub-mid'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Tiempo límite</p>
            <div className="flex gap-3">
              {TIME_OPTIONS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTimeMinutes(t.value)}
                  className={`flex-1 py-3 rounded-xl font-black text-sm border-2 transition-all ${timeMinutes === t.value ? 'bg-ub-dark text-white border-ub-dark shadow-lg shadow-ub-dark/20' : 'border-gray-200 text-gray-500 hover:border-ub-mid'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
            <p>• {Math.min(questionCount, allMC.length)} preguntas de opción múltiple del banco del parcial</p>
            <p>• Selección aleatoria cada vez</p>
            <p>• El tiempo corre; al agotarse se envía automáticamente</p>
            <p>• Resultados y puntaje al finalizar</p>
          </div>

          <button
            onClick={startExam}
            disabled={allMC.length === 0}
            className="w-full py-4 bg-ub-dark hover:bg-ub-mid text-white rounded-xl font-black text-lg transition-colors shadow-lg shadow-ub-dark/20 disabled:opacity-40"
          >
            Iniciar — {Math.min(questionCount, allMC.length)} preguntas · {timeMinutes} min
          </button>
        </div>
      </div>
    )
  }

  // ── EXAM ────────────────────────────────────────────────────────────────────
  if (phase === 'exam') {
    const current = pool[currentIdx]
    const answered = answers[current?.id]

    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-1">
              <span>Pregunta {currentIdx + 1} / {pool.length}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ub-light to-ub-mid transition-all duration-300 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm border transition-colors ${timerUrgent ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(secondsLeft)}
          </div>
        </div>

        {current && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{current.sectionTitle}</p>
            <p className="text-lg font-bold text-ub-dark mb-6 leading-snug">{current.text}</p>
            <div className="space-y-3">
              {current.choices.map(choice => {
                const isSelected = answered === choice.id
                return (
                  <button
                    key={choice.id}
                    onClick={() => !answered && handleAnswer(current.id, choice.id)}
                    disabled={!!answered}
                    className={`w-full text-left p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      !answered
                        ? 'border-gray-200 hover:border-ub-mid hover:bg-blue-50 text-gray-700'
                        : isSelected
                          ? 'border-ub-mid bg-ub-pale text-ub-dark'
                          : 'border-gray-100 text-gray-400'
                    }`}
                  >
                    <span className="font-black text-xs mr-2 text-gray-400">{choice.id.toUpperCase()}.</span>
                    {choice.text}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={() => finalize(answers)}
            className="text-xs text-gray-400 hover:text-red-500 font-bold transition-colors"
          >
            Finalizar anticipado
          </button>
        </div>
      </div>
    )
  }

  // ── RESULTS ─────────────────────────────────────────────────────────────────
  if (phase === 'results' && result) {
    const pctScore = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0
    const grade = pctScore >= 70 ? '✓ Aprobado' : pctScore >= 40 ? '~ Regular' : '✗ A repasar'
    const gradeColor = pctScore >= 70 ? 'text-green-600' : pctScore >= 40 ? 'text-amber-600' : 'text-red-600'

    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-ub-dark px-6 py-6 text-center">
            <p className="text-ub-pale/70 text-sm mb-1">Resultado</p>
            <p className="text-6xl font-black text-white">{result.score}<span className="text-3xl text-ub-pale/60">/{result.total}</span></p>
            <p className={`text-lg font-black mt-2 ${gradeColor.replace('text-', 'text-')} brightness-150`}>{grade}</p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-400 mb-1.5">
                <span>Aciertos</span>
                <span>{pctScore}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${pctScore >= 70 ? 'bg-green-400' : pctScore >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${pctScore}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Tiempo usado</p>
                <p className="text-lg font-black text-ub-dark">{formatTime(result.timeSpent)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Por pregunta</p>
                <p className="text-lg font-black text-ub-dark">
                  {result.total > 0 ? formatTime(Math.round(result.timeSpent / result.total)) : '—'}
                </p>
              </div>
            </div>

            {/* Per-question breakdown */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Detalle</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {pool.map((q, i) => {
                  const userAnswer = result.answers[q.id]
                  const correct = q.choices.find(c => c.correct)?.id
                  const isCorrect = userAnswer === correct
                  return (
                    <div key={q.id} className={`flex items-start gap-2 text-xs p-2 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <span className={`font-black flex-shrink-0 ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                      <span className="text-gray-600 leading-snug">{i + 1}. {q.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => setPhase('config')}
              className="w-full py-3 bg-ub-dark hover:bg-ub-mid text-white rounded-xl font-black transition-colors"
            >
              Volver a intentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
