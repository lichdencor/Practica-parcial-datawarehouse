import { useState, useEffect, createContext, useContext } from 'react'
import Login from './components/Login'
import Header from './components/Header'
import MultipleChoiceSection from './components/MultipleChoiceSection'
import DwhDiagram from './components/DwhDiagram'
import SqlShell from './components/SqlShell'
import { examSections } from './data/questions'

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3001'
const TOKEN_KEY = 'parcial_dbs2_token'

interface User {
  name: string
  email: string
  sub: string
}

interface ProgressContextType {
  progress: Record<string, any>
  saveProgress: (key: string, value: any) => void
  loading: boolean
}

export const ProgressContext = createContext<ProgressContextType>({
  progress: {},
  saveProgress: () => {},
  loading: false
})

function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    // Handle OAuth callback token in URL
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('auth_error')
    const logout = params.get('logout')

    if (error) {
      setAuthError(error)
      window.history.replaceState({}, '', window.location.pathname)
      setLoading(false)
      return
    }

    if (logout) {
      sessionStorage.removeItem(TOKEN_KEY)
      window.history.replaceState({}, '', window.location.pathname)
      setUser(null)
      setLoading(false)
      return
    }

    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token)
      window.history.replaceState({}, '', window.location.pathname)
    }

    const stored = sessionStorage.getItem(TOKEN_KEY)
    if (!stored) {
      setLoading(false)
      return
    }

    fetch(`${GATEWAY_URL}/api/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then(r => {
        if (!r.ok) throw new Error('Unauthorized')
        return r.json()
      })
      .then((data: User) => setUser(data))
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY)
    setUser(null)
    window.location.href = `${GATEWAY_URL}/logout`
  }

  return { user, loading, authError, logout }
}

function ProgressProvider({ children, user }: { children: React.ReactNode; user: User | null }) {
  const [progress, setProgress] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    const token = sessionStorage.getItem(TOKEN_KEY)
    setLoading(true)
    fetch(`${GATEWAY_URL}/api/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.progress) setProgress(data.progress)
      })
      .catch(err => console.error('Failed to load progress', err))
      .finally(() => setLoading(false))
  }, [user])

  const saveProgress = (key: string, value: any) => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    const newProgress = { ...progress, [key]: value }
    setProgress(newProgress)

    fetch(`${GATEWAY_URL}/api/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ progress: newProgress }),
    }).catch(err => console.error('Failed to save progress', err))
  }

  return (
    <ProgressContext.Provider value={{ progress, saveProgress, loading }}>
      {children}
    </ProgressContext.Provider>
  )
}

function SectionCard({ section }: { section: (typeof examSections)[0] }) {
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

function ExamPage({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick nav */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Navegación rápida</p>
          <div className="flex flex-wrap gap-2">
            {examSections.map(s => (
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

        {/* All sections in order */}
        {examSections.map(section => (
          <SectionCard key={section.id} section={section} />
        ))}
      </main>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400 mt-8">
        DBS2 — Modelo Parcial 2022 · Universidad de Belgrano
      </footer>
    </div>
  )
}

export default function App() {
  const { user, loading, authError, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-ub-dark flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-10 h-10 border-4 border-ub-pale border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm opacity-70">Verificando sesión…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login error={authError} />
  }

  return (
    <ProgressProvider user={user}>
      <ExamPage user={user} onLogout={logout} />
    </ProgressProvider>
  )
}
