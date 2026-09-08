import { CATEGORIES } from '../domain/categories'
import { dayShort, fromDateStr, todayStr } from '../domain/time'
import type { DayData } from '../db/hooks'

interface Props {
  days: DayData[]
  selected: string | null
  onSelect: (date: string) => void
}

export function WeekStrip({ days, selected, onSelect }: Props) {
  const today = todayStr()

  return (
    <div className="weekstrip">
      {days.map((day) => {
        const cats = [...new Set(day.blocks.map((b) => b.category))].slice(0, 3)
        const classes = ['daychip']
        if (day.date === today) classes.push('today')
        if (day.date === selected) classes.push('selected')

        return (
          <button
            key={day.date}
            className={classes.join(' ')}
            onClick={() => onSelect(day.date)}
            aria-pressed={day.date === selected}
          >
            <span>{dayShort(day.date)}</span>
            <b>{fromDateStr(day.date).getDate()}</b>
            <span className="chip-dots">
              {cats.map((c) => (
                <i key={c} style={{ background: CATEGORIES[c].color }} />
              ))}
              {day.shifts.length > 0 && <i style={{ background: CATEGORIES.evie.color }} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
