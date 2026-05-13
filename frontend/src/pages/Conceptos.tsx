import { useContext } from 'react'
import { ContentContext } from '../App'
import type { Concept, ConceptCategory } from '../data/theory'

function ConceptCard({ title, content }: Concept) {
  const parts = content.split(/\*\*(.*?)\*\*/g)

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-bold text-lg text-ub-dark mb-4">{title}</h3>
      <div className="text-gray-600 text-sm leading-relaxed">
        <p>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="text-ub-dark">{part}</strong> : part
          )}
        </p>
      </div>
    </div>
  )
}

function CategorySection({ category, subgroups, concepts }: ConceptCategory) {
  return (
    <div className="mb-14">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-8 border-b border-gray-100 pb-2">
        {category}
      </h4>

      {/* Flat concepts (no subgroups) */}
      {concepts && concepts.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {concepts.map(c => <ConceptCard key={c.id} {...c} />)}
        </div>
      )}

      {/* Subgroups */}
      {subgroups && subgroups.length > 0 && (
        <div className="space-y-10">
          {subgroups.map(sg => (
            <div key={sg.name}>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-ub-mid mb-4 flex items-center gap-2">
                <span className="inline-block w-4 h-px bg-ub-mid/40" />
                {sg.name}
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                {sg.concepts.map(c => <ConceptCard key={c.id} {...c} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Conceptos() {
  const { theory } = useContext(ContentContext)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-ub-dark">Conceptos Clave</h2>
        <p className="text-gray-500 mt-2 text-lg">La base teórica para dominar el modelado de datos y analítica.</p>
      </div>

      {theory.map(cat => (
        <CategorySection key={cat.category} {...cat} />
      ))}
    </div>
  )
}
