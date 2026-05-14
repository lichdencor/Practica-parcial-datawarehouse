import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import Login from './components/Login'
import Header from './components/Header'
import Navbar from './components/Navbar'
import AppRouter from './AppRouter'
import { examSections } from './data/questions'
import type { ExamSection, SqlExercise } from './data/questions'
import { SCHEMAS } from './data/sql_schemas'
import { theoryConcepts } from './data/theory'
import { quickPracticeData } from './data/practice_quick'
import { sqlPracticeData } from './data/sql_practice'
import { glossaryData } from './data/glossary'

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
  mastered: Record<string, any>
  saveProgress: (key: string, value: any, isCorrect?: boolean) => void
  resetPractice: (practiceIds: string[]) => void
  practiceResetKey: number
  loading: boolean
}

export const ProgressContext = createContext<ProgressContextType>({
  progress: {},
  mastered: {},
  saveProgress: () => {},
  resetPractice: () => {},
  practiceResetKey: 0,
  loading: false
})

// --- Content Context ---

type ExamSections = typeof examSections
type TheoryConcepts = typeof theoryConcepts
type QuickPracticeData = typeof quickPracticeData
type SqlPractices = typeof sqlPracticeData
type GlossaryData = typeof glossaryData

interface ContentContextType {
  questions: ExamSections
  theory: TheoryConcepts
  quickPractice: QuickPracticeData
  sqlPractices: SqlPractices
  glossary: GlossaryData
  saveContent: (type: 'questions' | 'theory' | 'quickPractice' | 'sqlPractices' | 'glossary', data: any) => Promise<void>
}

export const ContentContext = createContext<ContentContextType>({
  questions: examSections,
  theory: theoryConcepts,
  quickPractice: quickPracticeData,
  sqlPractices: sqlPracticeData,
  glossary: glossaryData,
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
  const [mastered, setMastered] = useState<Record<string, any>>({})
  const [practiceResetKey, setPracticeResetKey] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    setLoading(true)
    fetch(`${GATEWAY_URL}/api/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const prog = data.progress ?? {}
        setProgress(prog)

        if (data.mastered != null) {
          setMastered(data.mastered)
        } else {
          // First-time migration: treat all existing practice answers as mastered
          const practiceIdSet = new Set(quickPracticeData.map(item => item.id))
          const migrated: Record<string, any> = {}
          for (const [key, value] of Object.entries(prog)) {
            if (practiceIdSet.has(key) && value !== false && value != null) {
              migrated[key] = value
            }
          }
          setMastered(migrated)
          if (Object.keys(migrated).length > 0) {
            fetch(`${GATEWAY_URL}/api/progress`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ mastered: migrated }),
            }).catch(() => {})
          }
        }
      })
      .catch(err => console.error('Failed to load progress', err))
      .finally(() => setLoading(false))
  }, [user])

  const saveProgress = (key: string, value: any, isCorrect?: boolean) => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    const newProgress = { ...progress, [key]: value }
    setProgress(newProgress)

    let newMastered = mastered
    if (isCorrect && !(key in mastered)) {
      newMastered = { ...mastered, [key]: value }
      setMastered(newMastered)
    }

    const body: Record<string, any> = { progress: newProgress }
    if (newMastered !== mastered) body.mastered = newMastered

    fetch(`${GATEWAY_URL}/api/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }).catch(err => console.error('Failed to save progress', err))
  }

  const resetPractice = (practiceIds: string[]) => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    const idSet = new Set(practiceIds)
    const newProgress = Object.fromEntries(
      Object.entries(progress).filter(([key]) => !idSet.has(key))
    )
    setProgress(newProgress)
    setPracticeResetKey(k => k + 1)

    fetch(`${GATEWAY_URL}/api/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ progress: newProgress }),
    }).catch(err => console.error('Failed to reset practice', err))
  }

  return (
    <ProgressContext.Provider value={{ progress, mastered, saveProgress, resetPractice, practiceResetKey, loading }}>
      {children}
    </ProgressContext.Provider>
  )
}

// --- Content Provider ---

function ContentProvider({ children }: { children: React.ReactNode }) {
  const [questions, setQuestions] = useState<ExamSections>(examSections)
  const [theory, setTheory] = useState<TheoryConcepts>(theoryConcepts)
  const [quickPractice, setQuickPractice] = useState<QuickPracticeData>(quickPracticeData)
  const [sqlPractices, setSqlPractices] = useState<SqlPractices>(sqlPracticeData)
  const [glossary, setGlossary] = useState<GlossaryData>(glossaryData)

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
      fetchContent('sqlPractices'),
      fetchContent('glossary'),
    ]).then(([q, t, p, s, g]) => {
      if (q) {
        // Merge setupSql/verifyQuery from static examSections into MongoDB records that are missing them.
        // SQL schemas live in source code (not Mongo) so they don't bloat the stored document.
        const mergedQ = q.map((section: ExamSection) => {
          if (section.type !== 'sql-shell' || !section.sqlExercises) return section
          const staticSection = examSections.find(s => s.id === section.id)
          const mergedExercises = section.sqlExercises.map((ex: SqlExercise) => {
            const staticEx = staticSection?.sqlExercises?.find(se => se.id === ex.id)
            const resolvedSetup = ex.setupSql ?? staticEx?.setupSql ?? (ex.schemaRef ? SCHEMAS[ex.schemaRef] : undefined)
            return {
              ...ex,
              setupSql: resolvedSetup,
              verifyQuery: ex.verifyQuery ?? staticEx?.verifyQuery,
            }
          })
          return { ...section, sqlExercises: mergedExercises }
        })
        setQuestions(mergedQ)
      }
      if (t) setTheory(t)
      if (p) setQuickPractice(p)
      if (s) {
        // Merge static setupSql/verifyQuery into MongoDB records that are missing them.
        // This keeps SQL schemas in source code (not in Mongo) while allowing new
        // exercises added via Admin to carry their own setupSql string.
        const merged = s.map((practice: typeof sqlPracticeData[number]) => {
          const staticFallback = sqlPracticeData.find(sp => sp.id === practice.id)
          const resolvedSetup = practice.setupSql ?? staticFallback?.setupSql ?? (practice.schemaRef ? SCHEMAS[practice.schemaRef] : undefined)
          return {
            ...practice,
            setupSql: resolvedSetup,
            verifyQuery: practice.verifyQuery ?? staticFallback?.verifyQuery,
          }
        })
        setSqlPractices(merged)
      }
      if (g) setGlossary(g)
    })
  }, [])

  const saveContent = async (type: 'questions' | 'theory' | 'quickPractice' | 'sqlPractices' | 'glossary', data: any) => {
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
    if (type === 'sqlPractices') setSqlPractices(data)
    if (type === 'glossary') setGlossary(data)
  }

  return (
    <ContentContext.Provider value={{ questions, theory, quickPractice, sqlPractices, glossary, saveContent }}>
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
