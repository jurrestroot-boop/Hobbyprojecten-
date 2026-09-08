import { CATEGORIES } from './categories'
import type { Block, DateStr, Settings, Shift, WeekPlan } from './types'
import { dayName, formatDay, formatHours, isoWeekday, overlaps, toMinutes } from './time'
import type { WeekBalance } from './hours'

export type EveningState = 'samen' | 'evie-bezet' | 'jij-bezet' | 'onbekend'

export interface DayInsight {
  date: DateStr
  isOffice: boolean
  /** Hoe de avond ervoor staat, gegeven Evie's diensten en jouw blokken. */
  evening: EveningState
  eveningNote?: string
}

const EVENING_END = '23:00'

function busyInEvening(
  items: { start: string; end: string }[],
  eveningStart: string,
): { start: string; end: string } | undefined {
  return items.find((i) => overlaps(i.start, i.end, eveningStart, EVENING_END))
}

export function dayInsight(
  date: DateStr,
  blocks: Block[],
  evieBusy: Shift[],
  plan: WeekPlan | undefined,
  settings: Settings,
): DayInsight {
  const isOffice = plan?.officeDays.includes(date) ?? false
  const evieHit = busyInEvening(evieBusy, settings.eveningStart)
  const ownHit = busyInEvening(blocks, settings.eveningStart)

  if (evieHit) {
    const title = (evieHit as Shift).title
    return {
      date,
      isOffice,
      evening: 'evie-bezet',
      eveningNote: title
        ? `Evie: ${title} ${evieHit.start}–${evieHit.end}`
        : `Evie werkt ${evieHit.start}–${evieHit.end}`,
    }
  }
  if (ownHit) {
    return {
      date,
      isOffice,
      evening: 'jij-bezet',
      eveningNote: `Jij: ${ownHit.start}–${ownHit.end}`,
    }
  }
  return { date, isOffice, evening: 'samen', eveningNote: 'Avond vrij met Evie' }
}

export type WarningLevel = 'info' | 'let-op'

export interface Warning {
  id: string
  level: WarningLevel
  text: string
}

/**
 * De signalen die je wilt zien vóórdat de week begint: klopt het aantal
 * kantoordagen, haal je je uren, en verplan je een avond die vrij was.
 */
export function weekWarnings(args: {
  dates: DateStr[]
  blocks: Block[]
  evieBusy: Shift[]
  plan: WeekPlan | undefined
  balance: WeekBalance
  settings: Settings
}): Warning[] {
  const { dates, blocks, evieBusy, plan, balance, settings } = args
  const warnings: Warning[] = []

  const chosen = plan?.officeDays ?? []
  if (chosen.length !== settings.officeDaysRequired) {
    warnings.push({
      id: 'kantoordagen',
      level: 'let-op',
      text:
        chosen.length === 0
          ? `Nog geen kantoordagen gekozen — je moet ${settings.officeDaysRequired}× naar Middelburg.`
          : `${chosen.length} van ${settings.officeDaysRequired} kantoordagen gekozen.`,
    })
  }

  for (const t of balance.targets) {
    if (Math.abs(t.delta) < 0.25) continue
    warnings.push({
      id: `uren-${t.key}`,
      level: t.delta < 0 ? 'let-op' : 'info',
      text:
        t.delta < 0
          ? `${t.label}: nog ${formatHours(-t.delta)} uur in te plannen.`
          : `${t.label}: ${formatHours(t.delta)} uur meer gepland dan nodig.`,
    })
  }

  // Avonden waarop Evie vrij is maar jij werk hebt staan.
  for (const date of dates) {
    const evieFree = !evieBusy.some(
      (s) => s.date === date && overlaps(s.start, s.end, settings.eveningStart, EVENING_END),
    )
    if (!evieFree) continue
    const work = blocks.find(
      (b) =>
        b.date === date &&
        CATEGORIES[b.category].target !== null &&
        overlaps(b.start, b.end, settings.eveningStart, EVENING_END),
    )
    if (work) {
      warnings.push({
        id: `avond-${date}`,
        level: 'info',
        text: `${dayName(date)}avond ${formatDay(date)}: Evie is vrij, maar jij hebt "${work.title}" staan.`,
      })
    }
  }

  return warnings
}

/** Dubbele boekingen binnen je eigen agenda. */
export function findClashes(blocks: Block[]): [Block, Block][] {
  const sorted = [...blocks].sort(
    (a, b) => a.date.localeCompare(b.date) || toMinutes(a.start) - toMinutes(b.start),
  )
  const clashes: [Block, Block][] = []
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].date !== sorted[i].date) break
      if (overlaps(sorted[i].start, sorted[i].end, sorted[j].start, sorted[j].end)) {
        clashes.push([sorted[i], sorted[j]])
      }
    }
  }
  return clashes
}

/** Kantoordagen mogen alleen op de dagen die je in Instellingen hebt toegestaan. */
export function isOfficeCandidate(date: DateStr, settings: Settings): boolean {
  return settings.officeCandidateDays.includes(isoWeekday(date))
}
