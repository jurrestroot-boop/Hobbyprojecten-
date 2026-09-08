import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { DEFAULT_SETTINGS } from '../domain/defaults'
import { expandRules } from '../domain/recurring'
import { weekBalance } from '../domain/hours'
import { dayInsight, weekWarnings } from '../domain/insights'
import { toMinutes, weekDates, weekKey } from '../domain/time'
import type { Block, DateStr, Shift } from '../domain/types'

function byTime(a: { start: string }, b: { start: string }): number {
  return toMinutes(a.start) - toMinutes(b.start)
}

/** Alles wat één weekscherm nodig heeft, in één keer en live bijgewerkt. */
export function useWeek(anchor: DateStr) {
  const dates = weekDates(anchor)
  const key = weekKey(anchor)
  const from = dates[0]
  const to = dates[6]

  return useLiveQuery(async () => {
    const [settingsRow, storedBlocks, storedShifts, rules, exceptions, plan, calendars, externalRows] =
      await Promise.all([
        db.settings.get('settings'),
        db.blocks.where('date').between(from, to, true, true).toArray(),
        db.shifts.where('date').between(from, to, true, true).toArray(),
        db.rules.toArray(),
        db.exceptions.where('date').between(from, to, true, true).toArray(),
        db.weekPlans.get(key),
        db.calendars.toArray(),
        db.externalEvents.where('date').between(from, to, true, true).toArray(),
      ])

    const visibleCalendars = new Map(calendars.filter((c) => c.visible).map((c) => [c.id, c]))
    const external = externalRows
      .filter((e) => visibleCalendars.has(e.calendarId))
      .sort((a, b) => Number(b.allDay) - Number(a.allDay) || byTime(a, b))

    const settings = settingsRow ?? DEFAULT_SETTINGS
    const expanded = expandRules(rules, exceptions, dates, storedBlocks)

    const blocks = [...storedBlocks, ...expanded.blocks].sort(byTime)
    const evieBusy = [...storedShifts, ...expanded.evieBusy].sort(byTime)

    const balance = weekBalance(blocks, settings)
    const warnings = weekWarnings({ dates, blocks, evieBusy, plan, balance, settings })

    const days = dates.map((date) => {
      const dayBlocks = blocks.filter((b) => b.date === date)
      const dayShifts = evieBusy.filter((s) => s.date === date)
      const dayExternal = external.filter((e) => e.date === date)
      return {
        date,
        blocks: dayBlocks,
        shifts: dayShifts,
        external: dayExternal,
        insight: dayInsight(date, dayBlocks, dayShifts, plan, settings, dayExternal),
      }
    })

    rules.sort((a, b) => a.weekday - b.weekday || byTime(a, b))

    return {
      key, dates, days, blocks, evieBusy, balance, warnings, plan, settings, rules,
      calendars, calendarById: new Map(calendars.map((c) => [c.id, c])),
    }
  }, [anchor])
}

export type WeekData = NonNullable<ReturnType<typeof useWeek>>
export type DayData = WeekData['days'][number]
export type { Block, Shift }
