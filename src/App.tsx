import { useEffect, useState } from 'react'
import { useWeek } from './db/hooks'
import { seed } from './db/db'
import { HoursCard } from './components/HoursCard'
import { WeekStrip } from './components/WeekStrip'
import { DayCard } from './components/DayCard'
import { BlockSheet } from './components/BlockSheet'
import { WeekSetupSheet } from './components/WeekSetupSheet'
import { SettingsSheet } from './components/SettingsSheet'
import { addDays, formatRange, isoWeekParts, startOfWeek, todayStr } from './domain/time'
import type { Block, DateStr } from './domain/types'

type Sheet =
  | { kind: 'none' }
  | { kind: 'block'; block: Block | null; date: DateStr }
  | { kind: 'setup' }
  | { kind: 'settings' }

export default function App() {
  const [anchor, setAnchor] = useState<DateStr>(() => startOfWeek(todayStr()))
  const [selected, setSelected] = useState<DateStr | null>(null)
  const [sheet, setSheet] = useState<Sheet>({ kind: 'none' })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    seed().then(() => setReady(true))
  }, [])

  const week = useWeek(anchor)

  if (!ready || !week) {
    return <div className="app"><p className="hint" style={{ padding: 24 }}>Laden…</p></div>
  }

  const { week: weekNumber } = isoWeekParts(anchor)
  const isThisWeek = anchor === startOfWeek(todayStr())
  const visibleDays = selected ? week.days.filter((d) => d.date === selected) : week.days

  function goto(offset: number) {
    setAnchor((a) => addDays(a, offset * 7))
    setSelected(null)
  }

  function openBlock(block: Block | null, date: DateStr) {
    setSheet({ kind: 'block', block, date })
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-btn" onClick={() => goto(-1)} aria-label="Vorige week">‹</button>
        <h1>
          Week {weekNumber}
          <small>{formatRange(week.dates[0], week.dates[6])}{isThisWeek ? ' · deze week' : ''}</small>
        </h1>
        <button className="icon-btn" onClick={() => goto(1)} aria-label="Volgende week">›</button>
        <button className="icon-btn" onClick={() => setSheet({ kind: 'settings' })} aria-label="Instellingen">⚙</button>
      </header>

      {!week.plan?.plannedAt && (
        <button
          className="btn primary"
          style={{ width: '100%', marginBottom: 10 }}
          onClick={() => setSheet({ kind: 'setup' })}
        >
          Deze week inplannen — kantoordagen en Evie's rooster
        </button>
      )}

      <HoursCard balance={week.balance} />

      {week.warnings.length > 0 && (
        <div className="card">
          <div className="card-title">
            <span>Signalen</span>
            <button className="pill" onClick={() => setSheet({ kind: 'setup' })}>Weekopzet</button>
          </div>
          <div className="warnings">
            {week.warnings.map((w) => (
              <div className={`warning ${w.level}`} key={w.id}>
                <span>{w.level === 'let-op' ? '⚠' : 'ℹ'}</span>
                <span>{w.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <WeekStrip
        days={week.days}
        selected={selected}
        onSelect={(date) => setSelected((s) => (s === date ? null : date))}
      />

      {visibleDays.map((day) => (
        <DayCard key={day.date} day={day} onEditBlock={(b) => openBlock(b, day.date)} onAdd={(d) => openBlock(null, d)} />
      ))}

      <button
        className="fab"
        aria-label="Blok toevoegen"
        onClick={() => openBlock(null, selected ?? (isThisWeek ? todayStr() : week.dates[0]))}
      >
        +
      </button>

      {sheet.kind === 'block' && (
        <BlockSheet block={sheet.block} date={sheet.date} onClose={() => setSheet({ kind: 'none' })} />
      )}
      {sheet.kind === 'setup' && <WeekSetupSheet week={week} onClose={() => setSheet({ kind: 'none' })} />}
      {sheet.kind === 'settings' && (
        <SettingsSheet settings={week.settings} rules={week.rules} onClose={() => setSheet({ kind: 'none' })} />
      )}
    </div>
  )
}
