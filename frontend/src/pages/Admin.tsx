import { useState, useEffect, useContext } from 'react'
import { ContentContext, UserContext } from '../App'
import { examSections } from '../data/questions'
import { theoryConcepts } from '../data/theory'
import { quickPracticeData } from '../data/practice_quick'
import { sqlPracticeData } from '../data/sql_practice'
import { glossaryData } from '../data/glossary'
import DwhDiagramBuilder from '../components/DwhDiagramBuilder'
import Modal from '../components/Modal'
import type { DwhDiagramConfig } from '../data/questions'

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

  const resetProgress = async (userId: string) => {
    if (!confirm('¿Estás seguro de que querés resetear el progreso de este usuario? Esta acción no se puede deshacer.')) return
    setSaving(userId)
    setError(null)
    try {
      const token = sessionStorage.getItem(TOKEN_KEY)
      const res = await fetch(`${GATEWAY_URL}/api/admin/users/${userId}/progress`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al resetear el progreso')
      }
      alert('Progreso reseteado correctamente')
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
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => resetProgress(u.userId)}
                      disabled={saving === u.userId}
                      className="text-[10px] font-bold px-2 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-40 transition-all"
                      title="Resetear Progreso"
                    >
                      Reset Progreso
                    </button>
                    {u.userId !== currentUser.sub && (
                      <button
                        onClick={() => toggleRole(u.userId, u.role)}
                        disabled={saving === u.userId}
                        className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-all ${
                          u.role === 'admin'
                            ? 'border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                            : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                        } disabled:opacity-40`}
                      >
                        {saving === u.userId ? '…' : u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// --- Organica Section ---

interface OrganicaUser {
  _id: string
  email: string
  addedBy: string
  createdAt: string
}

interface OrganicaDomain {
  _id: string
  domain: string
  addedBy: string
  createdAt: string
}

function OrganicaSection() {
  const [users, setUsers] = useState<OrganicaUser[]>([])
  const [domains, setDomains] = useState<OrganicaDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    try {
      const [uRes, dRes] = await Promise.all([
        fetch(`${GATEWAY_URL}/api/admin/organica/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${GATEWAY_URL}/api/admin/organica/domains`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      const uData = await uRes.json()
      const dData = await dRes.json()
      setUsers(Array.isArray(uData) ? uData : [])
      setDomains(Array.isArray(dData) ? dData : [])
    } catch (err) {
      setError('Error al cargar datos de Organica')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.includes('@')) return
    setSubmitting(true)
    try {
      const token = sessionStorage.getItem(TOKEN_KEY)
      const res = await fetch(`${GATEWAY_URL}/api/admin/organica/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail })
      })
      if (!res.ok) throw new Error('Error al añadir usuario')
      setNewEmail('')
      fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const addDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomain.includes('.')) return
    setSubmitting(true)
    try {
      const token = sessionStorage.getItem(TOKEN_KEY)
      const res = await fetch(`${GATEWAY_URL}/api/admin/organica/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ domain: newDomain.replace('@', '') })
      })
      if (!res.ok) throw new Error('Error al añadir dominio')
      setNewDomain('')
      fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const removeUser = async (id: string) => {
    if (!confirm('¿Eliminar este usuario de la lista blanca?')) return
    const token = sessionStorage.getItem(TOKEN_KEY)
    await fetch(`${GATEWAY_URL}/api/admin/organica/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    fetchData()
  }

  const removeDomain = async (id: string) => {
    if (!confirm('¿Eliminar este dominio de la lista blanca?')) return
    const token = sessionStorage.getItem(TOKEN_KEY)
    await fetch(`${GATEWAY_URL}/api/admin/organica/domains/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    fetchData()
  }

  if (loading) return <p className="text-gray-400 text-sm">Cargando Organica…</p>

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      {/* Dominios Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800">Dominios Permitidos</h3>
        <p className="text-gray-400 text-xs mb-4">Cualquier usuario con estos dominios podrá ingresar (ej: comunidad.ub.edu.ar).</p>
        
        <form onSubmit={addDomain} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="ej: gmail.com"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            className="flex-1 text-sm p-2 rounded-lg border border-gray-200 focus:border-ub-mid outline-none"
          />
          <button
            disabled={submitting}
            className="px-4 py-2 bg-ub-dark text-white text-xs font-bold rounded-lg hover:bg-ub-mid disabled:opacity-50"
          >
            Añadir Dominio
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {domains.map(d => (
            <div key={d._id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg group">
              <span className="text-xs font-bold text-gray-700">@{d.domain}</span>
              <button
                onClick={() => removeDomain(d._id)}
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          {domains.length === 0 && <p className="text-xs text-gray-400 italic">No hay dominios configurados.</p>}
        </div>
      </div>

      {/* Usuarios Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800">Emails Específicos</h3>
        <p className="text-gray-400 text-xs mb-4">Correos individuales que tienen acceso aunque su dominio no esté permitido.</p>

        <form onSubmit={addUser} className="flex gap-2 mb-6">
          <input
            type="email"
            placeholder="usuario@ejemplo.com"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="flex-1 text-sm p-2 rounded-lg border border-gray-200 focus:border-ub-mid outline-none"
          />
          <button
            disabled={submitting}
            className="px-4 py-2 bg-ub-dark text-white text-xs font-bold rounded-lg hover:bg-ub-mid disabled:opacity-50"
          >
            Añadir Email
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {users.map(u => (
            <div key={u._id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl group">
              <span className="text-xs font-medium text-gray-700">{u.email}</span>
              <button
                onClick={() => removeUser(u._id)}
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
          {users.length === 0 && <p className="text-xs text-gray-400 italic">No hay emails configurados.</p>}
        </div>
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
  {
    key: 'sqlPractices' as const,
    label: 'Módulo SQL Training',
    description: 'Ejercicios de SQL estructurados por niveles',
    defaultData: sqlPracticeData,
  },
  {
    key: 'glossary' as const,
    label: 'Glosario DWH',
    description: 'Términos y definiciones del glosario de Data Warehousing',
    defaultData: glossaryData,
  },
]

function validateContent(type: string, data: any): string | null {
  if (!Array.isArray(data)) return 'El contenido debe ser un array.'

  if (type === 'sqlPractices') {
    for (const item of data) {
      if (!item.id || !item.title || !item.difficulty || !item.objective || !item.referenceQuery) {
        return 'Estructura de SQL Practice inválida. id, title, difficulty, objective y referenceQuery son obligatorios.'
      }
      if (!['facil', 'intermedio', 'avanzado', 'reto'].includes(item.difficulty)) {
        return 'Dificultad inválida: ' + item.difficulty
      }
    }
  }

  if (type === 'quickPractice') {
    for (const item of data) {
      if (!item.id || !item.type) return 'Estructura de Práctica inválida. id y type son obligatorios.'
      if (item.type === 'fact-dimension') {
        if (!item.tableName || !Array.isArray(item.columns) || !item.correctType) return 'Faltan campos para FACT vs Dimension'
      }
      if (item.type === 'flashcard') {
        if (!item.front || !item.back) return 'Faltan campos para Flashcard'
      }
      if (item.type === 'multiple-choice') {
        if (!item.question || !Array.isArray(item.choices)) return 'Faltan campos para Múltiple Choice en Práctica'
      }
    }
  }

  if (type === 'theory') {
    for (const cat of data) {
      if (!cat.category) return 'Cada categoría debe tener un nombre.'
      const concepts = cat.concepts || []
      const subgroups = cat.subgroups || []
      if (!Array.isArray(concepts) || !Array.isArray(subgroups)) return 'concepts y subgroups deben ser arrays.'
      for (const c of concepts) {
        if (!c.id || !c.title || !c.content) return 'Concepto inválido en ' + cat.category
      }
      for (const s of subgroups) {
        if (!s.name || !Array.isArray(s.concepts)) return 'Subgrupo inválido en ' + cat.category
        for (const c of s.concepts) {
          if (!c.id || !c.title || !c.content) return 'Concepto inválido en subgrupo ' + s.name
        }
      }
    }
  }

  if (type === 'glossary') {
    for (const item of data) {
      if (!item.id || !item.term || !item.definition || !item.category) {
        return 'Entrada inválida. id, term, definition y category son obligatorios.'
      }
    }
  }

  if (type === 'questions') {
    for (const section of data) {
      if (!section.id || !section.title || !section.type) return 'Sección de preguntas inválida. id, title y type son obligatorios.'
      if (!['multiple-choice', 'dwh-diagram', 'sql-shell', 'schema-question'].includes(section.type)) return 'Tipo de sección inválido: ' + section.type
      
      if (section.type === 'multiple-choice') {
        if (!Array.isArray(section.questions)) return 'La sección multiple-choice debe tener un array de questions.'
        for (const q of section.questions) {
          if (!q.id || !q.text || !Array.isArray(q.choices)) return 'Pregunta inválida en ' + section.title
          for (const c of q.choices) {
            if (!c.id || !c.text || typeof c.correct !== 'boolean') return 'Opción inválida en pregunta ' + q.id
          }
        }
      }
      if (section.type === 'dwh-diagram' && !section.diagram) return 'Falta el objeto diagram en la sección ' + section.title
      if (section.type === 'sql-shell' && !Array.isArray(section.sqlExercises)) return 'Falta el array sqlExercises en la sección ' + section.title
    }
  }

  return null
}

function ContentEditor({ contentKey, label, description, currentData }: {
  contentKey: 'questions' | 'theory' | 'quickPractice' | 'sqlPractices' | 'glossary'
  label: string
  description: string
  currentData: any
}) {
  const { saveContent } = useContext(ContentContext)
  const [editing, setEditing] = useState(false)
  const [mode, setMode] = useState<'visual' | 'json'>('visual')
  const [jsonText, setJsonText] = useState('')
  const [tempData, setTempData] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleEdit = () => {
    setTempData(JSON.parse(JSON.stringify(currentData)))
    setJsonText(JSON.stringify(currentData, null, 2))
    setEditing(true)
    setMode('visual')
    setError(null)
    setSuccess(false)
  }

  const handleJsonChange = (val: string) => {
    setJsonText(val)
    try {
      const parsed = JSON.parse(val)
      const err = validateContent(contentKey, parsed)
      setError(err)
      if (!err) setTempData(parsed)
    } catch {
      setError('JSON inválido.')
    }
  }

  const handleSave = async () => {
    const err = validateContent(contentKey, tempData)
    if (err) {
      setError(err)
      return
    }

    setSaving(true)
    try {
      await saveContent(contentKey, tempData)
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const updateItem = (index: number, newItem: any) => {
    const updated = [...tempData]
    updated[index] = newItem
    setTempData(updated)
    setJsonText(JSON.stringify(updated, null, 2))
  }

  const addItem = () => {
    let newItem: any
    if (contentKey === 'quickPractice') {
      newItem = { id: `p${Date.now()}`, tableName: 'Nueva Tabla', columns: [], correctType: 'fact', explanation: '' }
    } else if (contentKey === 'theory') {
      newItem = { category: 'Nueva Categoría', concepts: [] }
    } else if (contentKey === 'sqlPractices') {
      newItem = { id: `sql_${Date.now()}`, title: 'Nueva Práctica SQL', difficulty: 'facil', description: '', objective: '', hint: '', referenceQuery: '' }
    } else if (contentKey === 'glossary') {
      newItem = { id: `g_${Date.now()}`, term: 'Nuevo Término', definition: '', category: 'Conceptos Base' }
    } else {
      newItem = { id: Date.now(), title: 'Nuevo Punto', subtitle: '', type: 'multiple-choice', questions: [] }
    }
    const updated = [...tempData, newItem]
    setTempData(updated)
    setJsonText(JSON.stringify(updated, null, 2))
  }

  const removeItem = (index: number) => {
    const updated = tempData.filter((_: any, i: number) => i !== index)
    setTempData(updated)
    setJsonText(JSON.stringify(updated, null, 2))
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
          <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setMode('visual')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                mode === 'visual' ? 'bg-white text-ub-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Visual
            </button>
            <button
              onClick={() => setMode('json')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                mode === 'json' ? 'bg-white text-ub-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              JSON Raw
            </button>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {mode === 'json' ? (
            <textarea
              value={jsonText}
              onChange={e => handleJsonChange(e.target.value)}
              className={`w-full h-96 font-mono text-xs bg-gray-950 text-green-400 p-4 rounded-xl border ${error ? 'border-red-500' : 'border-gray-800'} resize-y focus:outline-none focus:border-ub-mid`}
              spellCheck={false}
            />
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto p-2 border border-dashed border-gray-200 rounded-xl">
              {tempData.map((item: any, idx: number) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative group">
                  <button
                    onClick={() => removeItem(idx)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  {contentKey === 'sqlPractices' && (
                    <div className="grid gap-3">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Título</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={e => updateItem(idx, { ...item, title: e.target.value })}
                            className="w-full text-xs font-bold p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dificultad</label>
                          <select
                            value={item.difficulty}
                            onChange={e => updateItem(idx, { ...item, difficulty: e.target.value })}
                            className="text-xs font-bold p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                          >
                            <option value="facil">Fácil</option>
                            <option value="intermedio">Intermedio</option>
                            <option value="avanzado">Avanzado</option>
                            <option value="reto">Reto</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Descripción (Contexto)</label>
                        <textarea
                          value={item.description}
                          onChange={e => updateItem(idx, { ...item, description: e.target.value })}
                          className="w-full text-xs p-2 rounded border border-gray-200 h-16 resize-none focus:outline-none focus:border-ub-mid"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Objetivo (Qué debe hacer)</label>
                        <textarea
                          value={item.objective}
                          onChange={e => updateItem(idx, { ...item, objective: e.target.value })}
                          className="w-full text-xs p-2 rounded border border-gray-200 h-16 resize-none focus:outline-none focus:border-ub-mid font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pista (Hint)</label>
                          <input
                            type="text"
                            value={item.hint}
                            onChange={e => updateItem(idx, { ...item, hint: e.target.value })}
                            className="w-full text-xs p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Consulta de Referencia</label>
                          <textarea
                            value={item.referenceQuery}
                            onChange={e => updateItem(idx, { ...item, referenceQuery: e.target.value })}
                            className="w-full text-xs font-mono p-2 rounded border border-gray-200 h-20 focus:outline-none focus:border-ub-mid bg-gray-900 text-green-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Esquema (Opcional)</label>
                        <textarea
                          value={item.schema}
                          onChange={e => updateItem(idx, { ...item, schema: e.target.value })}
                          className="w-full text-[10px] font-mono p-2 rounded border border-gray-200 h-20 focus:outline-none focus:border-ub-mid bg-gray-50"
                          placeholder="CREATE TABLE ... "
                        />
                      </div>
                    </div>
                  )}
                  {contentKey === 'quickPractice' && (
                    <div className="grid gap-3">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo de Ejercicio</label>
                          <select
                            value={item.type || 'fact-dimension'}
                            onChange={e => updateItem(idx, { ...item, type: e.target.value })}
                            className="w-full text-xs font-bold p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                          >
                            <option value="fact-dimension">FACT vs Dimension</option>
                            <option value="multiple-choice">Múltiple Choice</option>
                            <option value="theory">Pregunta Teórica</option>
                            <option value="flashcard">Flashcard (Carrusel)</option>
                          </select>
                        </div>
                      </div>

                      {item.type === 'fact-dimension' && (
                        <>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tabla</label>
                              <input
                                type="text"
                                value={item.tableName}
                                onChange={e => updateItem(idx, { ...item, tableName: e.target.value })}
                                className="w-full text-xs font-bold p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Correcta</label>
                              <select
                                value={item.correctType}
                                onChange={e => updateItem(idx, { ...item, correctType: e.target.value })}
                                className="text-xs font-bold p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                              >
                                <option value="fact">FACT</option>
                                <option value="dimension">Dimension</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Columnas</label>
                            <input
                              type="text"
                              value={(item.columns || []).join(', ')}
                              onChange={e => updateItem(idx, { ...item, columns: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })}
                              className="w-full text-xs p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                            />
                          </div>
                        </>
                      )}

                      {(item.type === 'multiple-choice' || item.type === 'theory') && (
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pregunta</label>
                          <input
                            type="text"
                            value={item.question}
                            onChange={e => updateItem(idx, { ...item, question: e.target.value })}
                            className="w-full text-xs p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                          />
                        </div>
                      )}

                      {item.type === 'multiple-choice' && (
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase">Opciones</label>
                          {(item.choices || []).map((c: any, cIdx: number) => (
                            <div key={cIdx} className="flex gap-2 items-center">
                              <input
                                type="checkbox"
                                checked={c.correct}
                                onChange={e => {
                                  const newChoices = [...item.choices]
                                  newChoices[cIdx] = { ...c, correct: e.target.checked }
                                  updateItem(idx, { ...item, choices: newChoices })
                                }}
                              />
                              <input
                                type="text"
                                value={c.text}
                                onChange={e => {
                                  const newChoices = [...item.choices]
                                  newChoices[cIdx] = { ...c, text: e.target.value }
                                  updateItem(idx, { ...item, choices: newChoices })
                                }}
                                className="flex-1 text-[11px] p-1 border-b border-gray-100 focus:outline-none"
                              />
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newChoices = [...(item.choices || []), { id: `c${Date.now()}`, text: 'Nueva Opción', correct: false }]
                              updateItem(idx, { ...item, choices: newChoices })
                            }}
                            className="text-[10px] font-bold text-ub-mid hover:underline"
                          >
                            + Agregar Opción
                          </button>
                        </div>
                      )}

                      {item.type === 'flashcard' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Lado A (Nombre)</label>
                            <input
                              type="text"
                              value={item.front}
                              onChange={e => updateItem(idx, { ...item, front: e.target.value })}
                              className="w-full text-xs font-bold p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Lado B (Explicación)</label>
                            <textarea
                              value={item.back}
                              onChange={e => updateItem(idx, { ...item, back: e.target.value })}
                              className="w-full text-xs p-2 rounded border border-gray-200 h-10 resize-none focus:outline-none focus:border-ub-mid"
                            />
                          </div>
                        </div>
                      )}

                      {item.type !== 'flashcard' && (
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Explicación / Feedback</label>
                          <textarea
                            value={item.explanation}
                            onChange={e => updateItem(idx, { ...item, explanation: e.target.value })}
                            className="w-full text-xs p-2 rounded border border-gray-200 h-16 resize-none focus:outline-none focus:border-ub-mid"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {contentKey === 'theory' && (
                    <div className="grid gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Categoría</label>
                        <input
                          type="text"
                          value={item.category}
                          onChange={e => updateItem(idx, { ...item, category: e.target.value })}
                          className="w-full text-xs font-bold p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                        />
                      </div>
                      <div className="pl-4 border-l-2 border-gray-100 space-y-3">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Conceptos Directos</label>
                        {(item.concepts || []).map((c: any, cIdx: number) => (
                          <div key={cIdx} className="bg-white p-3 rounded-lg border border-gray-200 relative">
                            <button
                              onClick={() => {
                                const newConcepts = item.concepts.filter((_: any, i: number) => i !== cIdx)
                                updateItem(idx, { ...item, concepts: newConcepts })
                              }}
                              className="absolute top-1 right-1 text-gray-300 hover:text-red-500"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <input
                              type="text"
                              placeholder="ID"
                              value={c.id}
                              onChange={e => {
                                const newConcepts = [...item.concepts]
                                newConcepts[cIdx] = { ...c, id: e.target.value }
                                updateItem(idx, { ...item, concepts: newConcepts })
                              }}
                              className="w-full text-[10px] font-mono mb-1 border-b border-gray-100 focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Título"
                              value={c.title}
                              onChange={e => {
                                const newConcepts = [...item.concepts]
                                newConcepts[cIdx] = { ...c, title: e.target.value }
                                updateItem(idx, { ...item, concepts: newConcepts })
                              }}
                              className="w-full text-xs font-bold mb-1 border-b border-gray-100 focus:outline-none"
                            />
                            <textarea
                              placeholder="Contenido (Markdown)"
                              value={c.content}
                              onChange={e => {
                                const newConcepts = [...item.concepts]
                                newConcepts[cIdx] = { ...c, content: e.target.value }
                                updateItem(idx, { ...item, concepts: newConcepts })
                              }}
                              className="w-full text-[11px] h-20 resize-none focus:outline-none"
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newConcepts = [...(item.concepts || []), { id: `c${Date.now()}`, title: 'Nuevo Concepto', content: '' }]
                            updateItem(idx, { ...item, concepts: newConcepts })
                          }}
                          className="text-[10px] font-bold text-ub-mid hover:underline"
                        >
                          + Agregar Concepto
                        </button>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Subgrupos</label>
                          {(item.subgroups || []).map((s: any, sIdx: number) => (
                            <div key={sIdx} className="mb-4 bg-gray-100/50 p-3 rounded-xl border border-gray-200 relative">
                              <button
                                onClick={() => {
                                  const newSubgroups = item.subgroups.filter((_: any, i: number) => i !== sIdx)
                                  updateItem(idx, { ...item, subgroups: newSubgroups })
                                }}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                              <input
                                type="text"
                                placeholder="Nombre del Subgrupo"
                                value={s.name}
                                onChange={e => {
                                  const newSubgroups = [...item.subgroups]
                                  newSubgroups[sIdx] = { ...s, name: e.target.value }
                                  updateItem(idx, { ...item, subgroups: newSubgroups })
                                }}
                                className="w-full text-xs font-black bg-transparent border-b border-gray-200 mb-3 focus:outline-none"
                              />
                              <div className="space-y-2">
                                {(s.concepts || []).map((sc: any, scIdx: number) => (
                                  <div key={scIdx} className="bg-white p-2 rounded border border-gray-200 relative">
                                    <button
                                      onClick={() => {
                                        const newSc = s.concepts.filter((_: any, i: number) => i !== scIdx)
                                        const newSubgroups = [...item.subgroups]
                                        newSubgroups[sIdx] = { ...s, concepts: newSc }
                                        updateItem(idx, { ...item, subgroups: newSubgroups })
                                      }}
                                      className="absolute top-1 right-1 text-gray-300 hover:text-red-500"
                                    >
                                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                    <input
                                      type="text"
                                      placeholder="Título"
                                      value={sc.title}
                                      onChange={e => {
                                        const newSc = [...s.concepts]
                                        newSc[scIdx] = { ...sc, title: e.target.value }
                                        const newSubgroups = [...item.subgroups]
                                        newSubgroups[sIdx] = { ...s, concepts: newSc }
                                        updateItem(idx, { ...item, subgroups: newSubgroups })
                                      }}
                                      className="w-full text-[10px] font-bold mb-1 focus:outline-none"
                                    />
                                    <textarea
                                      placeholder="Contenido"
                                      value={sc.content}
                                      onChange={e => {
                                        const newSc = [...s.concepts]
                                        newSc[scIdx] = { ...sc, content: e.target.value }
                                        const newSubgroups = [...item.subgroups]
                                        newSubgroups[sIdx] = { ...s, concepts: newSc }
                                        updateItem(idx, { ...item, subgroups: newSubgroups })
                                      }}
                                      className="w-full text-[10px] h-12 resize-none focus:outline-none"
                                    />
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newSc = [...(s.concepts || []), { id: `sc${Date.now()}`, title: 'Nuevo Concepto', content: '' }]
                                    const newSubgroups = [...item.subgroups]
                                    newSubgroups[sIdx] = { ...s, concepts: newSc }
                                    updateItem(idx, { ...item, subgroups: newSubgroups })
                                  }}
                                  className="text-[9px] font-bold text-ub-mid hover:underline"
                                >
                                  + Agregar Concepto al Subgrupo
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newSubgroups = [...(item.subgroups || []), { name: 'Nuevo Subgrupo', concepts: [] }]
                              updateItem(idx, { ...item, subgroups: newSubgroups })
                            }}
                            className="text-[10px] font-bold text-gray-500 hover:text-ub-dark"
                          >
                            + Crear Nuevo Subgrupo
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {contentKey === 'glossary' && (
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Término</label>
                          <input
                            type="text"
                            value={item.term}
                            onChange={e => updateItem(idx, { ...item, term: e.target.value })}
                            className="w-full text-xs font-bold p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Categoría</label>
                          <input
                            type="text"
                            value={item.category}
                            onChange={e => updateItem(idx, { ...item, category: e.target.value })}
                            className="w-full text-xs p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                            list="glossary-categories"
                          />
                          <datalist id="glossary-categories">
                            <option value="Conceptos Base" />
                            <option value="Modelado" />
                            <option value="Tablas" />
                            <option value="Análisis" />
                          </datalist>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Definición</label>
                        <textarea
                          value={item.definition}
                          onChange={e => updateItem(idx, { ...item, definition: e.target.value })}
                          className="w-full text-xs p-2 rounded border border-gray-200 h-20 resize-none focus:outline-none focus:border-ub-mid"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ejemplo (Opcional)</label>
                        <input
                          type="text"
                          value={item.example ?? ''}
                          onChange={e => updateItem(idx, { ...item, example: e.target.value || undefined })}
                          className="w-full text-xs p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                          placeholder="Ej: ..."
                        />
                      </div>
                    </div>
                  )}
                  {contentKey === 'questions' && (
                    <div className="grid gap-3">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Título</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={e => updateItem(idx, { ...item, title: e.target.value })}
                            className="w-full text-xs font-bold p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo</label>
                          <select
                            value={item.type}
                            onChange={e => updateItem(idx, { ...item, type: e.target.value })}
                            className="text-xs font-bold p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                          >
                            <option value="multiple-choice">Múltiple Choice</option>
                            <option value="dwh-diagram">Diagrama DWH</option>
                            <option value="sql-shell">SQL Shell</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Subtítulo</label>
                        <input
                          type="text"
                          value={item.subtitle}
                          onChange={e => updateItem(idx, { ...item, subtitle: e.target.value })}
                          className="w-full text-xs p-2 rounded border border-gray-200 focus:outline-none focus:border-ub-mid"
                        />
                      </div>
                      {item.type === 'multiple-choice' && (
                        <div className="pl-4 border-l-2 border-gray-100 space-y-3">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase">Preguntas</label>
                          {(item.questions || []).map((q: any, qIdx: number) => (
                            <div key={qIdx} className="bg-white p-3 rounded-lg border border-gray-200 relative">
                              <button
                                onClick={() => {
                                  const newQuestions = item.questions.filter((_: any, i: number) => i !== qIdx)
                                  updateItem(idx, { ...item, questions: newQuestions })
                                }}
                                className="absolute top-1 right-1 text-gray-300 hover:text-red-500"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                              <input
                                type="text"
                                placeholder="Texto de la pregunta"
                                value={q.text}
                                onChange={e => {
                                  const newQuestions = [...item.questions]
                                  newQuestions[qIdx] = { ...q, text: e.target.value }
                                  updateItem(idx, { ...item, questions: newQuestions })
                                }}
                                className="w-full text-xs font-bold mb-2 border-b border-gray-100 focus:outline-none"
                              />
                              <div className="space-y-1">
                                {(q.choices || []).map((c: any, cIdx: number) => (
                                  <div key={cIdx} className="flex gap-2 items-center">
                                    <input
                                      type="checkbox"
                                      checked={c.correct}
                                      onChange={e => {
                                        const newQuestions = [...item.questions]
                                        const newChoices = [...q.choices]
                                        newChoices[cIdx] = { ...c, correct: e.target.checked }
                                        newQuestions[qIdx] = { ...q, choices: newChoices }
                                        updateItem(idx, { ...item, questions: newQuestions })
                                      }}
                                    />
                                    <input
                                      type="text"
                                      value={c.text}
                                      onChange={e => {
                                        const newQuestions = [...item.questions]
                                        const newChoices = [...q.choices]
                                        newChoices[cIdx] = { ...c, text: e.target.value }
                                        newQuestions[qIdx] = { ...q, choices: newChoices }
                                        updateItem(idx, { ...item, questions: newQuestions })
                                      }}
                                      className="flex-1 text-[11px] border-b border-gray-50 focus:outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newQuestions = [...(item.questions || []), { id: `q${Date.now()}`, text: 'Nueva Pregunta', choices: [{ id: 'a', text: 'Opción A', correct: true }], explanation: '' }]
                              updateItem(idx, { ...item, questions: newQuestions })
                            }}
                            className="text-[10px] font-bold text-ub-mid hover:underline"
                          >
                            + Agregar Pregunta
                          </button>
                        </div>
                      )}
                      {item.type !== 'multiple-choice' && (
                        <p className="text-[10px] text-gray-400 italic">Los diagramas y ejercicios SQL son complejos de editar visualmente. Usá el modo JSON.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={addItem}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-ub-mid hover:border-ub-mid hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-bold text-xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                Agregar nuevo item
              </button>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={saving || !!error}
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

// --- Esquemas Section (DWH Builder) ---

const EMPTY_DIAGRAM: DwhDiagramConfig = {
  title: 'Nuevo Esquema',
  description: '',
  tables: [],
  connections: [],
}

function EsquemasSection() {
  const { questions, saveContent } = useContext(ContentContext)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<DwhDiagramConfig>(EMPTY_DIAGRAM)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftSubtitle, setDraftSubtitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const diagramSections = questions.filter(
    s => s.type === 'dwh-diagram' || s.type === 'schema-question'
  )

  const startEdit = (globalIdx: number) => {
    const section = questions[globalIdx]
    setDraft(section.diagram ?? EMPTY_DIAGRAM)
    setDraftTitle(section.title || '')
    setDraftSubtitle(section.subtitle || '')
    setSelectedIdx(globalIdx)
    setCreating(false)
  }

  const startCreate = () => {
    setDraft(EMPTY_DIAGRAM)
    setDraftTitle(`Punto ${questions.length + 1}`)
    setDraftSubtitle('')
    setCreating(true)
    setSelectedIdx(null)
  }

  const closeEditor = () => {
    setSelectedIdx(null)
    setCreating(false)
  }

  const saveEdit = async () => {
    if (selectedIdx === null) return
    setSaving(true)
    const updated = questions.map((s, i) =>
      i === selectedIdx ? { ...s, diagram: draft, title: draftTitle, subtitle: draftSubtitle } : s
    )
    try {
      await saveContent('questions', updated)
      setSuccess(true)
      closeEditor()
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const saveNew = async () => {
    if (!draftTitle.trim()) return
    setSaving(true)
    const newSection = {
      id: Math.max(...questions.map(q => q.id), 0) + 1,
      title: draftTitle.trim(),
      subtitle: draftSubtitle.trim(),
      type: 'schema-question' as const,
      diagram: draft,
      questions: [],
    }
    try {
      await saveContent('questions', [...questions, newSection])
      setCreating(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs font-medium">
          Esquema guardado correctamente en MongoDB.
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Construí y editá diagramas DWH visualmente. Los cambios se guardan en MongoDB y aplican a todos los usuarios.
        </p>
        <button
          onClick={startCreate}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-ub-dark text-white hover:bg-ub-mid transition-all"
        >
          + Nuevo Ejercicio de Esquema
        </button>
      </div>

      {/* Existing diagram sections list */}
      {diagramSections.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {diagramSections.map(section => {
            const globalIdx = questions.indexOf(section)
            return (
              <div
                key={section.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-ub-mid/50 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${section.type === 'schema-question' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {section.type === 'schema-question' ? 'Esquema + Preguntas' : 'Diagrama DWH'}
                    </span>
                    <p className="font-bold text-sm text-gray-800 mt-1">{section.title}</p>
                    <p className="text-xs text-gray-400">{section.subtitle}</p>
                  </div>
                  <button
                    onClick={() => startEdit(globalIdx)}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-ub-mid/30 text-ub-mid hover:bg-blue-50 flex-shrink-0"
                  >
                    Editar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {diagramSections.length === 0 && !creating && (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <p>No hay ejercicios de diagrama. Creá uno con el botón de arriba.</p>
        </div>
      )}

      {/* Editor Modal (Handles both New and Edit) */}
      <Modal
        isOpen={creating || selectedIdx !== null}
        onClose={closeEditor}
        title={creating ? 'Nuevo Ejercicio de Esquema' : 'Editar Esquema DWH'}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Título del Punto</label>
              <input
                type="text"
                value={draftTitle}
                onChange={e => setDraftTitle(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-ub-mid"
                placeholder="Ej: Punto 7"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Subtítulo / Tema</label>
              <input
                type="text"
                value={draftSubtitle}
                onChange={e => setDraftSubtitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-ub-mid"
                placeholder="Ej: Star Schema - Ventas"
              />
            </div>
          </div>

          <div className="p-1 bg-gray-50 rounded-2xl border border-gray-100">
            <DwhDiagramBuilder value={draft} onChange={setDraft} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={closeEditor}
              className="px-6 py-2.5 text-gray-500 text-sm font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={creating ? saveNew : saveEdit}
              disabled={saving || !draftTitle.trim()}
              className="px-8 py-2.5 bg-ub-dark text-white text-sm font-bold rounded-xl hover:bg-ub-mid shadow-lg shadow-ub-dark/20 disabled:opacity-50 transition-all"
            >
              {saving ? 'Guardando…' : (creating ? 'Crear Ejercicio' : 'Guardar Cambios')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function Admin() {
  const { questions, theory, quickPractice, sqlPractices, glossary } = useContext(ContentContext)
  const [tab, setTab] = useState<'users' | 'content' | 'esquemas' | 'organica'>('users')

  const currentData = { questions, theory, quickPractice, sqlPractices, glossary }

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
          onClick={() => setTab('organica')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'organica' ? 'bg-white text-ub-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Organica
        </button>
        <button
          onClick={() => setTab('content')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'content' ? 'bg-white text-ub-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Contenido
        </button>
        <button
          onClick={() => setTab('esquemas')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'esquemas' ? 'bg-white text-ub-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Esquemas DWH
        </button>
      </div>

      {tab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-1">Usuarios registrados</h3>
          <p className="text-gray-400 text-xs mb-5">Los admins marcados con estrella son super-admins definidos en el servidor y no pueden ser degradados desde aquí.</p>
          <UsersSection />
        </div>
      )}

      {tab === 'organica' && (
        <div className="space-y-4">
          <p className="text-gray-500 text-sm mb-6">
            Gestioná la "Lista Blanca" de acceso institucional. Usuarios con dominios permitidos podrán ingresar sin estar configurados en Dex.
          </p>
          <OrganicaSection />
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

      {tab === 'esquemas' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-1">Constructor de Esquemas DWH</h3>
          <p className="text-gray-400 text-xs mb-5">
            Armá diagramas DWH visualmente. Podés editar los esquemas existentes o crear nuevos ejercicios de tipo "Esquema + Preguntas" donde el alumno ve el diagrama y responde preguntas sobre él.
          </p>
          <EsquemasSection />
        </div>
      )}
    </div>
  )
}
