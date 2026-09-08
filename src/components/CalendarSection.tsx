import { useState } from 'react'
import { db, newId } from '../db/db'
import { applyIcs, syncCalendar } from '../db/sync'
import { CALENDAR_COLORS } from '../domain/defaults'
import type { Calendar } from '../domain/types'

function relativeTime(iso?: string): string {
  if (!iso) return 'nog niet bijgewerkt'
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'zojuist bijgewerkt'
  if (mins < 60) return `${mins} min geleden bijgewerkt`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} uur geleden bijgewerkt`
  return `${Math.round(hours / 24)} dagen geleden bijgewerkt`
}

/** Beheer van de externe agenda's: Delta, school, Smart Consultant. */
export function CalendarSection({ calendars }: { calendars: Calendar[] }) {
  const [adding, setAdding] = useState(calendars.length === 0)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [color, setColor] = useState(CALENDAR_COLORS[calendars.length % CALENDAR_COLORS.length])
  const [busyId, setBusyId] = useState<string | null>(null)

  async function add() {
    const calendar: Calendar = {
      id: newId('cal'),
      name: name.trim(),
      url: url.trim() || undefined,
      color,
      visible: true,
    }
    await db.calendars.add(calendar)
    setName('')
    setUrl('')
    setColor(CALENDAR_COLORS[(calendars.length + 1) % CALENDAR_COLORS.length])
    setAdding(false)
    if (calendar.url) await run(calendar, () => syncCalendar(calendar))
  }

  async function run(calendar: Calendar, job: () => Promise<unknown>) {
    setBusyId(calendar.id)
    try {
      await job()
    } finally {
      setBusyId(null)
    }
  }

  async function remove(calendar: Calendar) {
    if (!confirm(`Agenda "${calendar.name}" en alle ingeladen afspraken verwijderen?`)) return
    await db.transaction('rw', db.calendars, db.externalEvents, async () => {
      await db.externalEvents.where('calendarId').equals(calendar.id).delete()
      await db.calendars.delete(calendar.id)
    })
  }

  async function importFile(calendar: Calendar, file: File) {
    const text = await file.text()
    await run(calendar, () => applyIcs(calendar, text))
  }

  return (
    <div className="setup-step">
      <h3>Agenda's</h3>
      <p className="hint">
        Plak per agenda de ICS-link. Bij Google Agenda vind je die onder instellingen van de agenda →
        "Geheim adres in iCal-indeling". Deze links blijven alleen op dit toestel.
      </p>

      <ul className="list-reset">
        {calendars.map((cal) => (
          <li className="cal-row" key={cal.id}>
            <span className="dot" style={{ background: cal.color }} />
            <span className="who">
              <b>{cal.name}</b>
              <span>
                {busyId === cal.id
                  ? 'bezig…'
                  : `${cal.eventCount ?? 0} afspraken · ${relativeTime(cal.lastSyncedAt)}`}
              </span>
              {cal.lastError && <span className="err">{cal.lastError}</span>}
            </span>
            <span className="pills">
              <button
                className={`pill${cal.visible ? ' on' : ''}`}
                onClick={() => db.calendars.update(cal.id, { visible: !cal.visible })}
                title={cal.visible ? 'Verbergen' : 'Tonen'}
              >
                {cal.visible ? 'Aan' : 'Uit'}
              </button>
              {cal.url && (
                <button className="pill" disabled={busyId === cal.id} onClick={() => run(cal, () => syncCalendar(cal))}>
                  ⟳
                </button>
              )}
              <label className="pill" title="ICS-bestand importeren">
                Bestand
                <input
                  type="file"
                  accept=".ics,text/calendar"
                  hidden
                  onChange={(e) => e.target.files?.[0] && importFile(cal, e.target.files[0])}
                />
              </label>
              <button className="pill" onClick={() => remove(cal)} aria-label={`${cal.name} verwijderen`}>
                ✕
              </button>
            </span>
          </li>
        ))}
      </ul>

      {adding ? (
        <div style={{ marginTop: 12 }}>
          <div className="field">
            <label htmlFor="cal-name">Naam</label>
            <input
              id="cal-name"
              value={name}
              placeholder="Delta, School, Smart Consultant…"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cal-url">ICS-link</label>
            <input
              id="cal-url"
              type="url"
              inputMode="url"
              value={url}
              placeholder="https://… of webcal://…"
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="hint">Geen link? Laat leeg en importeer straks een .ics-bestand.</p>
          </div>
          <div className="field">
            <label>Kleur</label>
            <div className="swatches">
              {CALENDAR_COLORS.map((c) => (
                <button
                  key={c}
                  className={`swatch${color === c ? ' on' : ''}`}
                  style={{ '--sw': c } as React.CSSProperties}
                  onClick={() => setColor(c)}
                  aria-label={`Kleur ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="btn-row">
            {calendars.length > 0 && (
              <button className="btn ghost" onClick={() => setAdding(false)}>Annuleren</button>
            )}
            <button className="btn primary" disabled={!name.trim()} onClick={add}>
              Agenda toevoegen
            </button>
          </div>
        </div>
      ) : (
        <button className="btn" style={{ width: '100%', marginTop: 10 }} onClick={() => setAdding(true)}>
          + Agenda toevoegen
        </button>
      )}
    </div>
  )
}
