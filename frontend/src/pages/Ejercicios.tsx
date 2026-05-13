import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { ContentContext } from '../App'

export default function Ejercicios() {
  const { questions } = useContext(ContentContext)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-ub-dark">Banco de Ejercicios</h2>
        <p className="text-gray-500 mt-2">Acceso directo a cada punto del examen.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {questions.map(section => (
          <div key={section.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ub-mid mb-1">
              Punto {section.id}
            </span>
            <h3 className="font-bold text-gray-800 mb-4 flex-1">
              {section.subtitle}
            </h3>
            <Link
              to={`/integrador#section-${section.id}`}
              className="mt-auto bg-ub-pale/10 text-ub-mid hover:bg-ub-mid hover:text-white transition-all text-center py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-ub-mid/20"
            >
              Ir al ejercicio
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
