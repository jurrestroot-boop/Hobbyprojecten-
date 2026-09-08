import type { DateStr, TimeStr, Weekday } from './types'

const DAY_LABELS = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']
const MONTH_LABELS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

export function toDateStr(d: Date): DateStr {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function fromDateStr(s: DateStr): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayStr(): DateStr {
  return toDateStr(new Date())
}

/** Minuten sinds middernacht. */
export function toMinutes(t: TimeStr): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function fromMinutes(min: number): TimeStr {
  const clamped = Math.max(0, Math.min(24 * 60, Math.round(min)))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Duur in uren. Een eind vóór de start telt door tot na middernacht (nachtdienst). */
export function durationHours(start: TimeStr, end: TimeStr): number {
  let mins = toMinutes(end) - toMinutes(start)
  if (mins < 0) mins += 24 * 60
  return mins / 60
}

export function overlaps(aStart: TimeStr, aEnd: TimeStr, bStart: TimeStr, bEnd: TimeStr): boolean {
  const [a1, b1] = [toMinutes(aStart), toMinutes(bStart)]
  let a2 = toMinutes(aEnd)
  let b2 = toMinutes(bEnd)
  if (a2 <= a1) a2 = 24 * 60
  if (b2 <= b1) b2 = 24 * 60
  return a1 < b2 && b1 < a2
}

/** ISO-weekdag van een datum: 1 = maandag ... 7 = zondag. */
export function isoWeekday(date: DateStr): Weekday {
  const day = fromDateStr(date).getDay()
  return (day === 0 ? 7 : day) as Weekday
}

export function addDays(date: DateStr, days: number): DateStr {
  const d = fromDateStr(date)
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

/** De maandag van de ISO-week waar deze datum in valt. */
export function startOfWeek(date: DateStr): DateStr {
  return addDays(date, -(isoWeekday(date) - 1))
}

/** ISO-weeknummer en -jaar, want rond de jaarwisseling lopen die uiteen. */
export function isoWeekParts(date: DateStr): { year: number; week: number } {
  const d = fromDateStr(date)
  // Naar de donderdag van deze week: die bepaalt het ISO-jaar.
  d.setDate(d.getDate() + 4 - isoWeekday(date))
  const year = d.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + 1) / 7)
  return { year, week }
}

/** Sleutel voor een week, bijv. '2026-W37'. */
export function weekKey(date: DateStr): string {
  const { year, week } = isoWeekParts(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

/** De zeven datums van de week waar deze datum in valt, maandag eerst. */
export function weekDates(date: DateStr): DateStr[] {
  const monday = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/** De hoeveelste keer deze weekdag in de maand valt. 8 sep = 2e maandag → 2. */
export function nthWeekdayOfMonth(date: DateStr): number {
  return Math.ceil(fromDateStr(date).getDate() / 7)
}

export function dayName(date: DateStr): string {
  return DAY_LABELS[isoWeekday(date) - 1]
}

export function dayShort(date: DateStr): string {
  return dayName(date).slice(0, 2)
}

export function formatDay(date: DateStr): string {
  const d = fromDateStr(date)
  return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`
}

export function formatRange(from: DateStr, to: DateStr): string {
  const a = fromDateStr(from)
  const b = fromDateStr(to)
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()} – ${b.getDate()} ${MONTH_LABELS[b.getMonth()]}`
  }
  return `${formatDay(from)} – ${formatDay(to)}`
}

export function formatHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1).replace('.', ',')
}
