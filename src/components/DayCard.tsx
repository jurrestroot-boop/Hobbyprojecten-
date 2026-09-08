import { CATEGORIES, LOCATIONS } from '../domain/categories'
import { dayName, durationHours, formatDay, formatHours } from '../domain/time'
import type { Block } from '../domain/types'
import { SHIFT_LABELS } from '../domain/defaults'
import type { DayData } from '../db/hooks'

interface Props {
  day: DayData
  onEditBlock: (block: Block) => void
  onAdd: (date: string) => void
}

export function DayCard({ day, onEditBlock, onAdd }: Props) {
  const { insight } = day
  const items = [
    ...day.blocks.map((b) => ({ kind: 'block' as const, at: b.start, block: b })),
    ...day.shifts.map((s) => ({ kind: 'shift' as const, at: s.start, shift: s })),
  ].sort((a, b) => a.at.localeCompare(b.at))

  return (
    <section className="day" id={`day-${day.date}`}>
      <div className="day-head">
        <h2>{dayName(day.date)}</h2>
        <span className="date">{formatDay(day.date)}</span>
        <span className="spacer" />
        {insight.isOffice && <span className="tag kantoor">Middelburg</span>}
        {insight.evening === 'samen' ? (
          <span className="tag samen">Avond vrij</span>
        ) : insight.evening === 'evie-bezet' ? (
          <span className="tag bezet" title={insight.eveningNote}>Evie bezet</span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <button className="empty-day" onClick={() => onAdd(day.date)}>
          Nog niets gepland — tik om toe te voegen
        </button>
      ) : (
        <div className="blocks">
          {items.map((item) =>
            item.kind === 'block' ? (
              <button
                key={item.block.id}
                className="block"
                style={{ '--cat': CATEGORIES[item.block.category].color } as React.CSSProperties}
                onClick={() => onEditBlock(item.block)}
              >
                <span className="time">
                  <b>{item.block.start}</b>
                  {item.block.end}
                </span>
                <span className="body">
                  <b>{item.block.title}</b>
                  <span>
                    {CATEGORIES[item.block.category].label}
                    {item.block.location && ` · ${LOCATIONS[item.block.location]}`}
                  </span>
                </span>
                <span className="dur">{formatHours(durationHours(item.block.start, item.block.end))} u</span>
              </button>
            ) : (
              <div className="block shift" key={item.shift.id}>
                <span className="time">
                  <b>{item.shift.start}</b>
                  {item.shift.end}
                </span>
                <span className="body">
                  <b>{item.shift.title ?? `Evie · ${SHIFT_LABELS[item.shift.type].toLowerCase()}`}</b>
                  <span>{item.shift.note ?? 'Evie'}</span>
                </span>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  )
}
