import { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { UserContext } from './App'
import Conceptos from './pages/Conceptos'
import Practica from './pages/Practica'
import Ejercicios from './pages/Ejercicios'
import OlapToDwh from './pages/OlapToDwh'
import Integrador from './pages/Integrador'
import Glosario from './pages/Glosario'
import Cronometrado from './pages/Cronometrado'
import Admin from './pages/Admin'

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useContext(UserContext)
  return isAdmin ? <>{children}</> : <Navigate to="/integrador" replace />
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/conceptos" element={<Conceptos />} />
      <Route path="/practica" element={<Practica />} />
      <Route path="/ejercicios" element={<Ejercicios />} />
      <Route path="/olap-dwh" element={<OlapToDwh />} />
      <Route path="/integrador" element={<Integrador />} />
      <Route path="/glosario" element={<Glosario />} />
      <Route path="/cronometrado" element={<Cronometrado />} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="/" element={<Navigate to="/conceptos" replace />} />
      <Route path="*" element={<Navigate to="/conceptos" replace />} />
    </Routes>
  )
}
