const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3001'

interface LoginProps {
  error?: string | null
}

export default function Login({ error }: LoginProps) {
  const handleLogin = () => {
    window.location.href = `${GATEWAY_URL}/login`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ub-dark to-ub-mid flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-ub-pale rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-ub-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ub-dark">DBS2 · Modelo de Parcial</h1>
          <p className="text-gray-500 text-sm mt-1">Base de Datos II — 2022</p>
          <p className="text-gray-500 text-sm">Universidad de Belgrano</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left text-sm text-gray-600 space-y-1">
          <p className="font-semibold text-gray-700">Contenido del parcial:</p>
          <p>• OLAP vs OLTP · FACT vs Dimensión</p>
          <p>• Técnicas de diseño DWH · Tipos de dimensiones</p>
          <p>• Modelado dimensional con diagramas</p>
          <p>• Consultas SQL con métricas analíticas</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-red-700 text-sm">
            Error de autenticación: {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full bg-ub-mid hover:bg-ub-dark transition-colors text-white font-semibold py-3 px-6 rounded-xl text-base shadow-md"
        >
          Iniciar sesión con SSO
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Credenciales de prueba:<br />
          <span className="font-mono">estudiante@ub.edu.ar</span> / <span className="font-mono">password</span>
        </p>
      </div>
    </div>
  )
}
