import { useState, useEffect, useContext } from 'react'
import { ContentContext, UserContext } from '../App'
import { examSections } from '../data/questions'
import { theoryConcepts } from '../data/theory'
import { quickPracticeData } from '../data/practice_quick'

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3001'
const TOKEN_KEY = 'parcial_dbs2_token'

interface UserRecord {
  userId: string
  email: string
  name: string
  role: 'student' | 'admin'
  lastUpdated: string
}

// --- Users Section ---

function UsersSection() {
  const { user: currentUser } = useContext(UserContext)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    fetch(`${GATEWAY_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setUsers)
      .catch(() => setError('No se pudo cargar la lista de usuarios'))
      .finally(() => setLoading(false))
  }, [])

  const toggleRole = async (userId: string, currentRole: 'student' | 'admin') => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin'
    setSaving(userId)
    setError(null)
    try {
      const token = sessionStorage.getItem(TOKEN_KEY)
      const res = await fetch(`${GATEWAY_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cambiar el rol')
      }
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, role: newRole } : u))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <p className="text-gray-400 text-sm">Cargando usuarios…</p>

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-gray-400 font-bold">Usuario</th>
              <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-gray-400 font-bold">Email</th>
              <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-gray-400 font-bold">Rol</th>
              <th className="py-2 px-3" />
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.userId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-3 font-medium text-gray-800">{u.name || '—'}</td>
                <td className="py-3 px-3 text-gray-500">{u.email}</td>
                <td className="py-3 px-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
                    u.role === 'admin'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  {u.userId !== currentUser.sub && (
                    <button
                      onClick={() => toggleRole(u.userId, u.role)}
                      disabled={saving === u.userId}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                        u.role === 'admin'
                          ? 'border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                          : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                      } disabled:opacity-40`}
                    >
                      {saving === u.userId ? '…' : u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// --- Content Editor Section ---

const CONTENT_TYPES = [
  {
    key: 'questions' as const,
    label: 'Preguntas del Parcial',
    description: 'Preguntas de opción múltiple, diagramas DWH y ejercicios SQL',
    defaultData: examSections,
  },
  {
    key: 'theory' as const,
    label: 'Conceptos Teóricos',
    description: 'Cards de teoría con definiciones y explicaciones',
    defaultData: theoryConcepts,
  },
  {
    key: 'quickPractice' as const,
    label: 'Práctica Rápida',
    description: 'Ejercicios de identificación Fact vs Dimension',
    defaultData: quickPracticeData,
  },
]

function ContentEditor({ contentKey, label, description, currentData }: {
  contentKey: 'questions' | 'theory' | 'quickPractice'
  label: string
  description: string
  currentData: any
}) {
  const { saveContent } = useContext(ContentContext)
  const [editing, setEditing] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleEdit = () => {
    setJsonText(JSON.stringify(currentData, null, 2))
    setEditing(true)
    setError(null)
    setSuccess(false)
  }

  const handleSave = async () => {
    setError(null)
    let parsed: any
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      setError('JSON inválido. Revisá la sintaxis antes de guardar.')
      return
    }
    setSaving(true)
    try {
      await saveContent(contentKey, parsed)
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-bold text-gray-800">{label}</h3>
          <p className="text-gray-400 text-xs mt-0.5">{description}</p>
        </div>
        {!editing && (
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-ub-mid/30 text-ub-mid hover:bg-blue-50 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
        )}
      </div>

      {success && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-xs font-medium">
          Contenido guardado correctamente en MongoDB.
        </div>
      )}

      {editing && (
        <div className="mt-4">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">{error}</div>
          )}
          <textarea
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            className="w-full h-96 font-mono text-xs bg-gray-950 text-green-400 p-4 rounded-xl border border-gray-800 resize-y focus:outline-none focus:border-ub-mid"
            spellCheck={false}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-ub-dark text-white text-xs font-bold rounded-lg hover:bg-ub-mid transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar en MongoDB'}
            </button>
            <button
              onClick={() => { setEditing(false); setError(null) }}
              className="px-4 py-2 text-gray-500 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Main Admin Page ---

export default function Admin() {
  const { questions, theory, quickPractice } = useContext(ContentContext)
  const [tab, setTab] = useState<'users' | 'content'>('users')

  const currentData = { questions, theory, quickPractice }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Admin</span>
          <h2 className="text-3xl font-black text-ub-dark">Panel de Administración</h2>
        </div>
        <p className="text-gray-500 mt-1">Gestión de usuarios y contenido editable de la app.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('users')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'users' ? 'bg-white text-ub-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Usuarios
        </button>
        <button
          onClick={() => setTab('content')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'content' ? 'bg-white text-ub-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Contenido
        </button>
      </div>

      {tab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-1">Usuarios registrados</h3>
          <p className="text-gray-400 text-xs mb-5">Los admins marcados con estrella son super-admins definidos en el servidor y no pueden ser degradados desde aquí.</p>
          <UsersSection />
        </div>
      )}

      {tab === 'content' && (
        <div className="space-y-4">
          <p className="text-gray-500 text-sm mb-6">
            Los cambios guardados sobreescriben el contenido estático para todos los usuarios. Si querés restaurar el original, pegá el contenido del archivo <code className="bg-gray-100 px-1 rounded text-xs">src/data/*.ts</code>.
          </p>
          {CONTENT_TYPES.map(ct => (
            <ContentEditor
              key={ct.key}
              contentKey={ct.key}
              label={ct.label}
              description={ct.description}
              currentData={currentData[ct.key]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
