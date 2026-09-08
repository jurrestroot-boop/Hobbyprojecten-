import { useState } from 'react'
import { Sheet } from './Sheet'
import { db, newId } from '../db/db'
import { SHIFT_LABELS, SHIFT_PRESETS } from '../domain/defaults'
import { isOfficeCandidate } from '../domain/insights'
import { dayName, dayShort, formatDay, fromDateStr } from '../domain/time'
import type { DateStr, Settings, Shift, ShiftType, WeekPlan } from '../domain/types'
import type { WeekData } from '../db/hooks'

interface Props {
  week: WeekData
  onClose: () => void
}

/**
 * De weekstart: eerst je twee kantoordagen kiezen, daarna Evie's diensten
 * invoeren. Daarna weet de app welke avonden nog van jullie samen zijn.
 */
export function WeekSetupSheet({ week, onClose }: Props) {
  const { settings, dates, plan } = week
  const [officeDays, setOfficeDays] = useState<DateStr[]>(plan?.officeDays ?? [])

  function toggleOffice(date: DateStr) {
    setOfficeDays((current) => {
      if (current.includes(date)) return current.filter((d) => d !== date)
      if (current.length >= settings.officeDaysRequired) {
        // Vol: de oudste keuze wijkt voor de nieuwe.
        return [...current.slice(1), date]
      }
      return [...current, date]
    })
  }

  async function save() {
    const record: WeekPlan = { id: week.key, officeDays, plannedAt: new Date().toISOString() }
    await db.weekPlans.put(record)
    onClose()
  }

  return (
    <Sheet title={`Week ${week.key.split('W')[1]} inplannen`} onClose={onClose}>
      <div className="setup-step">
        <h3>1. Kantoordagen Middelburg</h3>
        <p className="hint">
          Kies er {settings.officeDaysRequired}. Gekozen: {officeDays.length}.
        </p>
        <div className="pills" style={{ marginTop: 8 }}>
          {dates.map((date) => {
            const allowed = isOfficeCandidate(date, settings)
            return (
              <button
                key={date}
                className={`pill${officeDays.includes(date) ? ' on' : ''}`}
                disabled={!allowed}
                onClick={() => toggleOffice(date)}
              >
                {dayShort(date)} {fromDateStr(date).getDate()}
              </button>
            )
          })}
        </div>
      </div>

      <div className="setup-step">
        <h3>2. Evie's diensten</h3>
        <p className="hint">Tik een dag aan om een dienst toe te voegen of te wissen.</p>
        <ul className="list-reset">
          {dates.map((date) => (
            <ShiftRow key={date} date={date} shifts={week.evieBusy.filter((s) => s.date === date)} settings={settings} />
          ))}
        </ul>
      </div>

      <div className="sheet-actions">
        <button className="btn ghost" onClick={onClose}>Later</button>
        <button className="btn primary" onClick={save}>Week vastzetten</button>
      </div>
    </Sheet>
  )
}

function ShiftRow({ date, shifts, settings }: { date: DateStr; shifts: Shift[]; settings: Settings }) {
  const [open, setOpen] = useState(false)
  const editable = shifts.filter((s) => !s.fromRuleId)
  const fixed = shifts.filter((s) => s.fromRuleId)

  async function addPreset(type: ShiftType, start: string, end: string) {
    await db.shifts.add({ id: newId('shf'), date, start, end, type })
    setOpen(false)
  }

  return (
    <li className="shift-row">
      <span className="who">
        <b>{dayName(date)}</b>
        <span>
          {editable.length === 0 && fixed.length === 0
            ? 'geen dienst'
            : [...editable, ...fixed]
                .map((s) => `${s.title ?? SHIFT_LABELS[s.type]} ${s.start}–${s.end}`)
                .join(' · ')}
        </span>
      </span>

      {editable.length > 0 ? (
        <button className="pill" onClick={() => db.shifts.bulkDelete(editable.map((s) => s.id))}>
          Wissen
        </button>
      ) : open ? (
        <span className="pills">
          {SHIFT_PRESETS.map((p) => (
            <button key={p.type} className="pill" onClick={() => addPreset(p.type, p.start, p.end)}>
              {p.label.slice(0, 5)}
            </button>
          ))}
          <button
            className="pill"
            onClick={() => addPreset('anders', settings.dayStart, settings.eveningStart)}
          >
            Anders
          </button>
        </span>
      ) : (
        <button className="pill" onClick={() => setOpen(true)} aria-label={`Dienst toevoegen op ${formatDay(date)}`}>
          +
        </button>
      )}
    </li>
  )
}
