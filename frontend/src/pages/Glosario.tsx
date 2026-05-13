import { useState, useContext, useMemo } from 'react'
import { ContentContext } from '../App'

const CATEGORY_COLORS: Record<string, string> = {
  'Conceptos Base': 'bg-blue-100 text-blue-700',
  'Modelado':       'bg-purple-100 text-purple-700',
  'Tablas':         'bg-green-100 text-green-700',
  'Análisis':       'bg-amber-100 text-amber-700',
}

export default function Glosario() {
  const { glossary } = useContext(ContentContext)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const categories = useMemo(
    () => Array.from(new Set(glossary.map(e => e.category))).sort(),
    [glossary]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return glossary.filter(e => {
      const matchSearch = !q || e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q)
      const matchCat = !activeCategory || e.category === activeCategory
      return matchSearch && matchCat
    })
  }, [glossary, search, activeCategory])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const entry of filtered) {
      if (!map.has(entry.category)) map.set(entry.category, [])
      map.get(entry.category)!.push(entry)
    }
    return map
  }, [filtered])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-ub-dark rounded-xl flex items-center justify-center text-white shadow-lg shadow-ub-dark/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-ub-dark">Glosario DWH</h2>
        </div>
        <p className="text-gray-500">{glossary.length} términos esenciales de Data Warehousing para repasar antes del parcial.</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar término o definición..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-ub-mid focus:ring-1 focus:ring-ub-mid/30"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${!activeCategory ? 'bg-ub-dark text-white border-ub-dark' : 'border-gray-200 text-gray-500 hover:border-ub-mid hover:text-ub-mid'}`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${activeCategory === cat ? 'bg-ub-dark text-white border-ub-dark' : 'border-gray-200 text-gray-500 hover:border-ub-mid hover:text-ub-mid'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Sin resultados para "{search}"</p>
        </div>
      )}

      {/* Grouped entries */}
      {Array.from(grouped.entries()).map(([category, entries]) => (
        <div key={category} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-600'}`}>
              {category}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-ub-mid/30 transition-all group">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-black text-ub-dark text-lg leading-tight group-hover:text-ub-mid transition-colors">
                    {entry.term}
                  </h3>
                  <span className={`flex-shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${CATEGORY_COLORS[entry.category] ?? 'bg-gray-100 text-gray-600'}`}>
                    {entry.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  {entry.definition}
                </p>
                {entry.example && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    <p className="text-[11px] text-amber-800 leading-snug">
                      <span className="font-black">Ej: </span>{entry.example}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
