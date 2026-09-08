import { describe, expect, it } from 'vitest'
import { parseIcs } from '../ics'

const SAMPLE = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//test//NL
BEGIN:VTIMEZONE
TZID:Europe/Amsterdam
BEGIN:STANDARD
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
END:DAYLIGHT
END:VTIMEZONE
BEGIN:VEVENT
UID:les-1
DTSTART;TZID=Europe/Amsterdam:20260903T133000
DTEND;TZID=Europe/Amsterdam:20260903T150000
RRULE:FREQ=WEEKLY;BYDAY=TH;COUNT=6
SUMMARY:Onderzoeksvaardigheden
LOCATION:Lokaal B2.14
END:VEVENT
BEGIN:VEVENT
UID:les-1
RECURRENCE-ID;TZID=Europe/Amsterdam:20260917T133000
DTSTART;TZID=Europe/Amsterdam:20260918T100000
DTEND;TZID=Europe/Amsterdam:20260918T113000
SUMMARY:Onderzoeksvaardigheden (verzet)
END:VEVENT
BEGIN:VEVENT
UID:vrij-1
DTSTART;VALUE=DATE:20260912
DTEND;VALUE=DATE:20260914
SUMMARY:Teamuitje
END:VEVENT
BEGIN:VEVENT
UID:oud-1
DTSTART:20260801T080000Z
DTEND:20260801T090000Z
SUMMARY:Buiten venster
END:VEVENT
END:VCALENDAR`

describe('parseIcs', () => {
  const events = parseIcs(SAMPLE, 'cal', '2026-09-07', '2026-09-27')

  it('klapt een wekelijkse les uit binnen het venster', () => {
    const lessen = events.filter((e) => e.title.startsWith('Onderzoeksvaardigheden'))
    expect(lessen.map((e) => e.date)).toEqual(['2026-09-10', '2026-09-18', '2026-09-24'])
  })

  it('respecteert een verzette les', () => {
    const verzet = events.find((e) => e.date === '2026-09-18')
    expect(verzet).toMatchObject({ start: '10:00', end: '11:30', title: 'Onderzoeksvaardigheden (verzet)' })
    expect(events.find((e) => e.date === '2026-09-17')).toBeUndefined()
  })

  it('zet lokale tijden om zonder verschuiving', () => {
    const eerste = events.find((e) => e.date === '2026-09-10')
    expect(eerste).toMatchObject({ start: '13:30', end: '15:00', location: 'Lokaal B2.14', allDay: false })
  })

  it('splitst een meerdaagse hele-dag-afspraak per dag', () => {
    const uitje = events.filter((e) => e.title === 'Teamuitje')
    expect(uitje.map((e) => e.date)).toEqual(['2026-09-12', '2026-09-13'])
    expect(uitje[0].allDay).toBe(true)
  })

  it('laat afspraken buiten het venster weg', () => {
    expect(events.some((e) => e.title === 'Buiten venster')).toBe(false)
  })
})
