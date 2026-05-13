import { useContext } from 'react'
import { ProgressContext } from '../App'
import { UserContext } from '../App'

interface HeaderProps {
  user: { name: string; email: string }
  onLogout: () => void
}

export default function Header({ user, onLogout }: HeaderProps) {
  const { progress } = useContext(ProgressContext)
  const { isAdmin } = useContext(UserContext)

  const totalItems = 30
  const completedItems = Object.keys(progress).length
  const percentage = Math.min(Math.round((completedItems / totalItems) * 100), 100)

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="bg-ub-dark text-white shadow-lg sticky top-0 z-50 border-b border-ub-mid/30">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-ub-mid w-10 h-10 rounded-full flex items-center justify-center font-bold text-ub-pale border-2 border-ub-light/20">
                {initials}
              </div>
              {isAdmin && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-900 text-[9px] font-black px-1 rounded leading-tight">
                  ADM
                </span>
              )}
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">{user.name}</h1>
              <p className="text-ub-pale text-xs opacity-70 truncate max-w-[150px] sm:max-w-none">{user.email}</p>
            </div>
          </div>

          <div className="flex-1 max-w-xs hidden md:block">
            <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-ub-pale mb-1">
              <span>Progreso Global</span>
              <span>{percentage}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-ub-light to-green-400 transition-all duration-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
