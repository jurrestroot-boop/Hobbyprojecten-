import { CATEGORIES } from '../domain/categories'
import type { WeekBalance } from '../domain/hours'
import { formatHours } from '../domain/time'

export function HoursCard({ balance }: { balance: WeekBalance }) {
  return (
    <div className="card">
      <div className="card-title">
        <span>Urenbalans</span>
        <span>{formatHours(balance.plannedTotal)} / {formatHours(balance.targetTotal)} u</span>
      </div>

      {balance.targets.map((t) => {
        const pct = t.target > 0 ? Math.min(100, (t.planned / t.target) * 100) : 0
        const color = CATEGORIES[t.key].color
        return (
          <div className="meter" key={t.key}>
            <div className="meter-head">
              <b>{t.label}</b>
              <span>
                {formatHours(t.planned)} / {t.target} u
                {Math.abs(t.delta) >= 0.25 && (t.delta < 0 ? ` · ${formatHours(-t.delta)} te kort` : ` · ${formatHours(t.delta)} over`)}
              </span>
            </div>
            <div className="meter-track">
              <div className="meter-fill" style={{ width: `${pct}%`, background: color }} />
              {t.delta > 0.25 && <div className="meter-over" />}
            </div>
          </div>
        )
      })}

      <div className="total-line">
        <span>Weektotaal</span>
        <b>
          {formatHours(balance.plannedTotal)} u
          {Math.abs(balance.delta) >= 0.25 &&
            ` (${balance.delta > 0 ? '+' : '−'}${formatHours(Math.abs(balance.delta))})`}
        </b>
      </div>
    </div>
  )
}
