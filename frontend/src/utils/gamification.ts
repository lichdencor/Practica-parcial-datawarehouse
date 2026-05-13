import type { ExamSection } from '../data/questions'

export type BadgeId = 'first_answer' | 'first_sql' | 'sql_module_complete' | 'flashcard_master' | 'integrador_complete'

export interface BadgeInfo {
  id: BadgeId
  label: string
  emoji: string
  description: string
}

export const BADGES: BadgeInfo[] = [
  { id: 'first_answer',        label: 'Primera Respuesta',  emoji: '🎯', description: 'Respondiste tu primera pregunta de opción múltiple.' },
  { id: 'first_sql',           label: 'SQL Debut',          emoji: '💻', description: 'Completaste tu primer ejercicio del módulo SQL Training.' },
  { id: 'sql_module_complete', label: 'SQL Completo',       emoji: '🏅', description: 'Terminaste todos los ejercicios del módulo SQL Training.' },
  { id: 'flashcard_master',    label: 'Flashcard Pro',      emoji: '🃏', description: 'Dominaste 5 o más flashcards.' },
  { id: 'integrador_complete', label: 'Data Engineer',      emoji: '🏆', description: 'Completaste el Integrador completo.' },
]

export const LEVELS = [
  { level: 1, xpMin: 0,    title: 'ETL Trainee',           emoji: '🌱' },
  { level: 2, xpMin: 50,   title: 'Dimension Mapper',      emoji: '📐' },
  { level: 3, xpMin: 150,  title: 'Star Modeler',          emoji: '⭐' },
  { level: 4, xpMin: 300,  title: 'OLAP Analyst',          emoji: '📊' },
  { level: 5, xpMin: 500,  title: 'Snowflake Architect',   emoji: '❄️' },
  { level: 6, xpMin: 750,  title: 'DWH Engineer',          emoji: '🏗️' },
  { level: 7, xpMin: 1000, title: 'Data Warehouse Master', emoji: '🎯' },
  { level: 8, xpMin: 1500, title: 'Principal DBA',         emoji: '👑' },
]

// XP per action:
// - flashcard learned (value === true): 5 XP
// - sql_* key (SQL Training): 15 XP
// - everything else (MC answer, fact/dim, integrador SQL): 10 XP
// - keys starting with _ are internal flags, skipped
export function computeXP(progress: Record<string, any>): number {
  let xp = 0
  for (const [key, value] of Object.entries(progress)) {
    if (key.startsWith('_')) continue
    if (value === false) continue
    if (value === true) { xp += 5; continue }
    if (key.startsWith('sql_')) { xp += 15; continue }
    xp += 10
  }
  return xp
}

export function getLevelInfo(xp: number) {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (xp >= lvl.xpMin) current = lvl
  }
  const nextLevel = LEVELS.find(l => l.level === current.level + 1) ?? null
  const xpInLevel = xp - current.xpMin
  const xpRange = nextLevel ? nextLevel.xpMin - current.xpMin : 1
  const progressPct = nextLevel ? Math.min(Math.round((xpInLevel / xpRange) * 100), 100) : 100
  return {
    ...current,
    xp,
    nextLevel,
    progressPct,
    xpToNext: nextLevel ? nextLevel.xpMin - xp : 0,
  }
}

export function getIntegradorItems(questions: ExamSection[]): string[] {
  const ids: string[] = []
  for (const section of questions) {
    if (section.type === 'multiple-choice' && section.questions) {
      ids.push(...section.questions.map(q => q.id))
    } else if (section.type === 'sql-shell' && section.sqlExercises) {
      ids.push(...section.sqlExercises.map(e => e.id))
    } else if (section.type === 'schema-question' && section.questions) {
      ids.push(...section.questions.map(q => q.id))
    }
  }
  return ids
}

export function computeBadges(
  progress: Record<string, any>,
  sqlPracticesCount: number,
): BadgeId[] {
  const earned: BadgeId[] = []
  const keys = Object.keys(progress).filter(k => !k.startsWith('_'))

  // MC answered: single-char choice id ('a', 'b', 'c', 'd')
  const hasMC = keys.some(k => typeof progress[k] === 'string' && progress[k].length === 1)
  if (hasMC) earned.push('first_answer')

  const sqlKeys = keys.filter(k => k.startsWith('sql_') && !!progress[k])
  if (sqlKeys.length >= 1) earned.push('first_sql')
  if (sqlPracticesCount > 0 && sqlKeys.length >= sqlPracticesCount) earned.push('sql_module_complete')

  const learnedFC = keys.filter(k => progress[k] === true).length
  if (learnedFC >= 5) earned.push('flashcard_master')

  if (progress['_integrador_complete'] === true) earned.push('integrador_complete')

  return earned
}
