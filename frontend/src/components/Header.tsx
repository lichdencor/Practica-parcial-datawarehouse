import { useContext, useState, useRef, useEffect, useMemo } from 'react'
import { ProgressContext, UserContext, ContentContext } from '../App'
import { computeXP, getLevelInfo, computeBadges, BADGES } from '../utils/gamification'

interface HeaderProps {
  user: { name: string; email: string }
  onLogout: () => void
}

export default function Header({ user, onLogout }: HeaderProps) {
  const { progress, mastered } = useContext(ProgressContext)
  const { isAdmin } = useContext(UserContext)
  const { questions, sqlPractices, quickPractice } = useContext(ContentContext)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const practiceIds = useMemo(() => new Set(quickPractice.map(item => item.id)), [quickPractice])
  const xp = computeXP(progress, mastered, practiceIds)
  const levelInfo = getLevelInfo(xp)
  const earnedBadgeIds = computeBadges(progress, mastered, sqlPractices.length)
  const earnedBadges = BADGES.filter(b => earnedBadgeIds.includes(b.id))
  const isIntegradorComplete = progress['_integrador_complete'] === true
  const displayTitle = isIntegradorComplete
    ? `x${questions.length} Data Engineer`
    : levelInfo.title
  const displayEmoji = isIntegradorComplete ? '🏆' : levelInfo.emoji

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <header className="bg-ub-dark text-white shadow-lg sticky top-0 z-50 border-b border-ub-mid/30">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* Avatar + dropdown */}
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(o => !o)}
                className="relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-ub-light rounded-full"
              >
                <div className={`bg-ub-mid w-10 h-10 rounded-full flex items-center justify-center font-bold text-ub-pale border-2 transition-all duration-200 ${open ? 'border-ub-light scale-110' : 'border-ub-light/20 hover:border-ub-light/60 hover:scale-105'}`}>
                  {initials}
                </div>
                {isAdmin && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-900 text-[9px] font-black px-1 rounded leading-tight pointer-events-none">
                    ADM
                  </span>
                )}
              </button>

              {open && (
                <div className="absolute top-full mt-2 left-0 w-72 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden">

                  {/* Profile header */}
                  <div className="bg-ub-dark px-5 py-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-ub-mid flex items-center justify-center font-black text-ub-pale text-xl border-2 border-ub-light/30 flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-white text-sm truncate">{user.name}</p>
                      <p className="text-ub-pale/60 text-[11px] truncate">{user.email}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-base leading-none">{displayEmoji}</span>
                        <span className={`text-xs font-black ${isIntegradorComplete ? 'text-amber-300' : 'text-ub-pale'}`}>
                          {displayTitle}
                        </span>
                        {isAdmin && (
                          <span className="bg-amber-400 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded">ADM</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* XP progress */}
                  <div className="px-5 py-3 border-b border-gray-100">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      <span>Nivel {levelInfo.level} — {levelInfo.xp} XP</span>
                      {levelInfo.nextLevel && (
                        <span>{levelInfo.xpToNext} XP → Nvl {levelInfo.nextLevel.level}</span>
                      )}
                      {!levelInfo.nextLevel && (
                        <span>Nivel máximo</span>
                      )}
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-ub-light to-green-400 transition-all duration-700 rounded-full"
                        style={{ width: `${levelInfo.progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Badges */}
                  {earnedBadges.length > 0 ? (
                    <div className="px-5 py-3 border-b border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Logros</p>
                      <div className="space-y-2">
                        {earnedBadges.map(b => (
                          <div key={b.id} className="flex items-center gap-2.5">
                            <span className="text-lg w-6 text-center flex-shrink-0">{b.emoji}</span>
                            <div>
                              <p className="text-xs font-bold text-gray-700 leading-tight">{b.label}</p>
                              <p className="text-[10px] text-gray-400 leading-tight">{b.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-3 border-b border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Logros</p>
                      <p className="text-xs text-gray-400 italic">Respondé preguntas para desbloquear logros.</p>
                    </div>
                  )}

                  {/* Logout */}
                  <button
                    onClick={() => { setOpen(false); onLogout() }}
                    className="w-full flex items-center gap-2.5 px-5 py-3 text-red-500 hover:bg-red-50 transition-colors text-sm font-bold"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>

            <div>
              <h1 className="text-base font-bold leading-tight">{user.name}</h1>
              <p className="text-ub-pale text-xs opacity-70 truncate max-w-[150px] sm:max-w-none">{user.email}</p>
            </div>
          </div>

          {/* XP level bar — center/desktop */}
          <div className="flex-1 max-w-xs hidden md:block">
            <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-ub-pale mb-1">
              <span>{displayEmoji} {displayTitle} · Nvl {levelInfo.level}</span>
              <span>{levelInfo.xp} XP</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-ub-light to-green-400 transition-all duration-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                style={{ width: `${levelInfo.progressPct}%` }}
              />
            </div>
          </div>

          {/* Spacer to preserve layout when no right-side button */}
          <div className="w-4 hidden md:block" />
        </div>
      </div>
    </header>
  )
}
