interface User {
  name: string
  email: string
}

interface HeaderProps {
  user: User
  onLogout: () => void
}

export default function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="bg-ub-dark text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold leading-tight">DBS2 — Modelo de Parcial 2022</h1>
          <p className="text-ub-pale text-xs opacity-80">Base de Datos II · Universidad de Belgrano</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm hidden sm:block">
            <p className="font-medium">{user.name}</p>
            <p className="text-ub-pale opacity-70 text-xs">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="bg-ub-mid hover:bg-ub-light transition-colors px-3 py-1.5 rounded text-sm font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  )
}
