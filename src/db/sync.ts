import { db } from './db'
import { parseIcs } from '../domain/ics'
import { addDays, todayStr } from '../domain/time'
import type { Calendar } from '../domain/types'

/** Hoe ver terug en vooruit we afspraken bewaren. */
const WEEKS_BACK = 4
const WEEKS_AHEAD = 12

export interface SyncResult {
  calendar: Calendar
  ok: boolean
  count: number
  error?: string
}

function syncWindow(): { from: string; to: string } {
  const today = todayStr()
  return { from: addDays(today, -7 * WEEKS_BACK), to: addDays(today, 7 * WEEKS_AHEAD) }
}

/** Vervangt alle afspraken van één agenda door wat er in de ICS-tekst staat. */
export async function applyIcs(calendar: Calendar, text: string): Promise<SyncResult> {
  const { from, to } = syncWindow()
  try {
    const events = parseIcs(text, calendar.id, from, to)
    await db.transaction('rw', db.externalEvents, db.calendars, async () => {
      await db.externalEvents.where('calendarId').equals(calendar.id).delete()
      await db.externalEvents.bulkPut(events)
      await db.calendars.update(calendar.id, {
        lastSyncedAt: new Date().toISOString(),
        lastError: undefined,
        eventCount: events.length,
      })
    })
    return { calendar, ok: true, count: events.length }
  } catch (err) {
    const error = 'Het bestand is geen geldige agenda: ' + (err instanceof Error ? err.message : String(err))
    await db.calendars.update(calendar.id, { lastError: error })
    return { calendar, ok: false, count: 0, error }
  }
}

/** Haalt de ICS-link van een agenda op. */
export async function syncCalendar(calendar: Calendar): Promise<SyncResult> {
  if (!calendar.url) {
    return { calendar, ok: false, count: 0, error: 'Deze agenda heeft geen link; importeer een bestand.' }
  }
  const url = calendar.url.replace(/^webcal:\/\//i, 'https://')

  let text: string
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    text = await res.text()
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    const error =
      reason === 'Failed to fetch'
        ? 'Kon de link niet ophalen vanuit de browser (de bron staat dat niet toe). Importeer het .ics-bestand.'
        : `Ophalen mislukt: ${reason}`
    await db.calendars.update(calendar.id, { lastError: error })
    return { calendar, ok: false, count: 0, error }
  }

  return applyIcs(calendar, text)
}

/** De synchroniseerknop: alle agenda's met een link achter elkaar. */
export async function syncAll(): Promise<SyncResult[]> {
  const calendars = (await db.calendars.toArray()).filter((c) => c.url)
  const results: SyncResult[] = []
  for (const calendar of calendars) {
    results.push(await syncCalendar(calendar))
  }
  return results
}
