import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import Login from './components/Login'
import Header from './components/Header'
import Navbar from './components/Navbar'
import AppRouter from './AppRouter'
import { examSections } from './data/questions'
import { theoryConcepts } from './data/theory'
import { quickPracticeData } from './data/practice_quick'

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3001'
const TOKEN_KEY = 'parcial_dbs2_token'

export interface User {
  name: string
  email: string
  sub: string
  role: 'student' | 'admin'
}

// --- User Context ---

interface UserContextType {
  user: User
  isAdmin: boolean
  logout: () => void
}

export const UserContext = createContext<UserContextType>({
  user: { name: '', email: '', sub: '', role: 'student' },
  isAdmin: false,
  logout: () => {},
})

// --- Progress Context ---

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

// --- Content Context ---

type ExamSections = typeof examSections
type TheoryConcepts = typeof theoryConcepts
type QuickPracticeData = typeof quickPracticeData

interface ContentContextType {
  questions: ExamSections
  theory: TheoryConcepts
  quickPractice: QuickPracticeData
  saveContent: (type: 'questions' | 'theory' | 'quickPractice', data: any) => Promise<void>
}

export const ContentContext = createContext<ContentContextType>({
  questions: examSections,
  theory: theoryConcepts,
  quickPractice: quickPracticeData,
  saveContent: async () => {},
})

// --- Auth Hook ---

function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
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

// --- Progress Provider ---

function ProgressProvider({ children, user }: { children: React.ReactNode; user: User }) {
  const [progress, setProgress] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
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

// --- Content Provider ---

function ContentProvider({ children }: { children: React.ReactNode }) {
  const [questions, setQuestions] = useState<ExamSections>(examSections)
  const [theory, setTheory] = useState<TheoryConcepts>(theoryConcepts)
  const [quickPractice, setQuickPractice] = useState<QuickPracticeData>(quickPracticeData)

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    const headers = { Authorization: `Bearer ${token}` }

    const fetchContent = async (type: string) => {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/content/${type}`, { headers })
        if (!res.ok) return null
        const doc = await res.json()
        return doc?.data ?? null
      } catch {
        return null
      }
    }

    Promise.all([
      fetchContent('questions'),
      fetchContent('theory'),
      fetchContent('quickPractice'),
    ]).then(([q, t, p]) => {
      if (q) setQuestions(q)
      if (t) setTheory(t)
      if (p) setQuickPractice(p)
    })
  }, [])

  const saveContent = async (type: 'questions' | 'theory' | 'quickPractice', data: any) => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    const res = await fetch(`${GATEWAY_URL}/api/admin/content/${type}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data }),
    })
    if (!res.ok) throw new Error('Failed to save content')

    if (type === 'questions') setQuestions(data)
    if (type === 'theory') setTheory(data)
    if (type === 'quickPractice') setQuickPractice(data)
  }

  return (
    <ContentContext.Provider value={{ questions, theory, quickPractice, saveContent }}>
      {children}
    </ContentContext.Provider>
  )
}

// --- Layout ---

function Layout({ onLogout }: { onLogout: () => void }) {
  const { user } = useContext(UserContext)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} onLogout={onLogout} />
      <Navbar />
      <main className="flex-1">
        <AppRouter />
      </main>
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
        DBS2 — Modelo Parcial 2022 · Universidad de Belgrano
      </footer>
    </div>
  )
}

// --- App Root ---

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

  const isAdmin = user.role === 'admin'

  return (
    <Router>
      <UserContext.Provider value={{ user, isAdmin, logout }}>
        <ProgressProvider user={user}>
          <ContentProvider>
            <Layout onLogout={logout} />
          </ContentProvider>
        </ProgressProvider>
      </UserContext.Provider>
    </Router>
  )
}
