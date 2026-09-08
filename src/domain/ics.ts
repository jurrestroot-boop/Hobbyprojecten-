import ICAL from 'ical.js'
import { toDateStr } from './time'
import type { DateStr, ExternalEvent } from './types'

/**
 * Zet een ICS-bestand om naar losse afspraken binnen een datumvenster.
 * Herhalende afspraken (wekelijkse lessen, vaste overleggen) worden uitgeklapt,
 * en uitzonderingen daarop (verzet, afgezegd) worden gerespecteerd.
 */
export function parseIcs(text: string, calendarId: string, from: DateStr, to: DateStr): ExternalEvent[] {
  const root = new ICAL.Component(ICAL.parse(text))

  for (const tz of root.getAllSubcomponents('vtimezone')) {
    ICAL.TimezoneService.register(tz)
  }

  // Groepeer per UID: één hoofdafspraak en eventueel afwijkende voorkomens.
  const masters = new Map<string, ICAL.Event>()
  const exceptions: ICAL.Event[] = []
  for (const comp of root.getAllSubcomponents('vevent')) {
    const event = new ICAL.Event(comp)
    if (event.isRecurrenceException()) exceptions.push(event)
    else masters.set(event.uid, event)
  }
  for (const ex of exceptions) {
    const master = masters.get(ex.uid)
    if (master) master.relateException(ex)
    else masters.set(`${ex.uid}#${ex.recurrenceId}`, ex)
  }

  const windowStart = ICAL.Time.fromDateString(from)
  const windowEnd = ICAL.Time.fromDateString(to)
  windowEnd.adjust(1, 0, 0, 0)

  const out: ExternalEvent[] = []

  for (const event of masters.values()) {
    if (!event.startDate) continue

    if (event.isRecurring()) {
      const iter = event.iterator()
      let next: ICAL.Time | null
      let guard = 0
      while ((next = iter.next()) && guard++ < 2000) {
        if (next.compare(windowEnd) >= 0) break
        const occ = event.getOccurrenceDetails(next)
        if (occ.endDate.compare(windowStart) < 0) continue
        pushEvent(out, calendarId, occ.item, occ.startDate, occ.endDate)
      }
    } else {
      if (event.endDate.compare(windowStart) < 0 || event.startDate.compare(windowEnd) >= 0) continue
      pushEvent(out, calendarId, event, event.startDate, event.endDate)
    }
  }

  return out
}

function pushEvent(out: ExternalEvent[], calendarId: string, item: ICAL.Event, start: ICAL.Time, end: ICAL.Time) {
  const title = (item.summary || 'Afspraak').trim()
  const location = item.location?.trim() || undefined
  const uid = `${item.uid}@${start.toString()}`

  if (start.isDate) {
    // Hele dag(en): één rij per dag, want de weekweergave is per dag.
    const cursor = start.clone()
    const stop = end.clone()
    if (stop.compare(cursor) <= 0) stop.adjust(1, 0, 0, 0)
    let n = 0
    while (cursor.compare(stop) < 0 && n++ < 60) {
      out.push({
        id: `${calendarId}:${uid}:${n}`,
        calendarId,
        date: toDateStr(cursor.toJSDate()),
        start: '00:00',
        end: '23:59',
        allDay: true,
        title,
        location,
      })
      cursor.adjust(1, 0, 0, 0)
    }
    return
  }

  const s = start.toJSDate()
  const e = end.toJSDate()
  out.push({
    id: `${calendarId}:${uid}`,
    calendarId,
    date: toDateStr(s),
    start: hhmm(s),
    end: hhmm(e),
    allDay: false,
    title,
    location,
  })
}

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
