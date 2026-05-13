import { useState, useEffect, useContext } from 'react'
import type { ExamSection, Question } from '../data/questions'
import { ProgressContext } from '../App'

function TheoryBlock({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="bg-blue-50 border-l-4 border-ub-mid rounded-r-xl p-4 mb-6 text-sm text-gray-700 space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        // Bold **text**
        const parts = line.split(/\*\*(.*?)\*\*/g)
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j} className="text-ub-dark">{part}</strong> : part
            )}
          </p>
        )
      })}
    </div>
  )
}

function QuestionCard({ question, index }: { question: Question; index: number }) {
  const { progress, saveProgress } = useContext(ProgressContext)
  const [selected, setSelected] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    if (progress[question.id]) {
      setSelected(progress[question.id])
      setShowExplanation(true)
    }
  }, [progress, question.id])

  const answered = selected !== null
  const correct = answered && question.choices.find(c => c.id === selected)?.correct

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
      <p className="font-medium text-gray-800 mb-3">
        <span className="text-ub-mid font-bold">{index + 1}. </span>
        {question.text}
      </p>

      <div className="space-y-2">
        {question.choices.map(choice => {
          const isSelected = selected === choice.id
          let cls = 'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all text-sm '

          if (!answered) {
            cls += 'border-gray-200 hover:border-ub-light hover:bg-blue-50'
          } else if (choice.correct) {
            cls += 'border-green-400 bg-green-50 text-green-800'
          } else if (isSelected && !choice.correct) {
            cls += 'border-red-300 bg-red-50 text-red-700'
          } else {
            cls += 'border-gray-200 text-gray-400'
          }

          return (
            <div
              key={choice.id}
              className={cls}
              onClick={() => {
                if (!answered) {
                  setSelected(choice.id)
                  setShowExplanation(true)
                  saveProgress(question.id, choice.id)
                }
              }}
            >
              <span className="w-5 h-5 rounded-full border-2 border-current flex-shrink-0 mt-0.5 flex items-center justify-center text-xs font-bold">
                {choice.id.toUpperCase()}
              </span>
              <span>{choice.text}</span>
              {answered && choice.correct && (
                <span className="ml-auto text-green-600 text-lg">✓</span>
              )}
              {answered && isSelected && !choice.correct && (
                <span className="ml-auto text-red-500 text-lg">✗</span>
              )}
            </div>
          )
        })}
      </div>

      {showExplanation && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${correct ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-orange-50 text-orange-800 border border-orange-200'}`}>
          <strong>{correct ? '¡Correcto! ' : 'Incorrecto. '}</strong>
          {question.explanation}
        </div>
      )}
    </div>
  )
}

interface MultipleChoiceSectionProps {
  section: ExamSection
}

export default function MultipleChoiceSection({ section }: MultipleChoiceSectionProps) {
  return (
    <div>
      {section.theory && <TheoryBlock text={section.theory} />}
      {section.questions?.map((q, i) => (
        <QuestionCard key={q.id} question={q} index={i} />
      ))}
    </div>
  )
}
