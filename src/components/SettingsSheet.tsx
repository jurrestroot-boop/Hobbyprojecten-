import { useState } from 'react'
import { Sheet } from './Sheet'
import { db } from '../db/db'
import { CATEGORIES } from '../domain/categories'
import type { RecurringRule, Settings, Weekday } from '../domain/types'

const WEEKDAYS: { id: Weekday; label: string }[] = [
  { id: 1, label: 'ma' }, { id: 2, label: 'di' }, { id: 3, label: 'wo' },
  { id: 4, label: 'do' }, { id: 5, label: 'vr' }, { id: 6, label: 'za' }, { id: 7, label: 'zo' },
]

const NTH_LABELS = ['elke week', '1e van de maand', '2e van de maand', '3e van de maand', '4e van de maand']

export function SettingsSheet({
  settings,
  rules,
  onClose,
}: {
  settings: Settings
  rules: RecurringRule[]
  onClose: () => void
}) {
  const [draft, setDraft] = useState<Settings>(settings)
  const [busy, setBusy] = useState(false)

  function patch(changes: Partial<Settings>) {
    setDraft((d) => ({ ...d, ...changes }))
  }

  function toggleCandidate(day: Weekday) {
    const has = draft.officeCandidateDays.includes(day)
    patch({
      officeCandidateDays: has
        ? draft.officeCandidateDays.filter((d) => d !== day)
        : [...draft.officeCandidateDays, day].sort(),
    })
  }

  async function save() {
    await db.settings.put(draft)
    onClose()
  }

  async function exportData() {
    const dump = {
      exportedAt: new Date().toISOString(),
      settings: await db.settings.toArray(),
      rules: await db.rules.toArray(),
      blocks: await db.blocks.toArray(),
      shifts: await db.shifts.toArray(),
      exceptions: await db.exceptions.toArray(),
      weekPlans: await db.weekPlans.toArray(),
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `weekplanner-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importData(file: File) {
    setBusy(true)
    try {
      const dump = JSON.parse(await file.text())
      await db.transaction('rw', db.tables, async () => {
        for (const table of db.tables) {
          const rows = dump[table.name]
          if (!Array.isArray(rows)) continue
          await table.clear()
          await table.bulkPut(rows)
        }
      })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet title="Instellingen" onClose={onClose}>
      <div className="field-row">
        <div className="field">
          <label htmlFor="set-opdr">Uren stageopdracht</label>
          <input
            id="set-opdr"
            type="number"
            min={0}
            value={draft.targets.stageopdracht}
            onChange={(e) => patch({ targets: { ...draft.targets, stageopdracht: Number(e.target.value) } })}
          />
        </div>
        <div className="field">
          <label htmlFor="set-stage">Uren schoolstage</label>
          <input
            id="set-stage"
            type="number"
            min={0}
            value={draft.targets.schoolstage}
            onChange={(e) => patch({ targets: { ...draft.targets, schoolstage: Number(e.target.value) } })}
          />
        </div>
      </div>
      <p className="hint">Je uren op school tellen binnen je schoolstage-uren.</p>

      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="set-office">Kantoordagen per week</label>
        <input
          id="set-office"
          type="number"
          min={0}
          max={7}
          value={draft.officeDaysRequired}
          onChange={(e) => patch({ officeDaysRequired: Number(e.target.value) })}
        />
      </div>

      <div className="field">
        <label>Kantoor mag op</label>
        <div className="pills">
          {WEEKDAYS.map((d) => (
            <button
              key={d.id}
              className={`pill${draft.officeCandidateDays.includes(d.id) ? ' on' : ''}`}
              onClick={() => toggleCandidate(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="set-evening">Avond begint om</label>
        <input
          id="set-evening"
          type="time"
          value={draft.eveningStart}
          onChange={(e) => patch({ eveningStart: e.target.value })}
        />
        <p className="hint">Bepaalt wanneer de app een avond als "vrij met Evie" ziet.</p>
      </div>

      <div className="setup-step">
        <h3>Vaste afspraken</h3>
        <ul className="list-reset">
          {rules.map((rule) => (
            <RuleRow key={rule.id} rule={rule} />
          ))}
        </ul>
      </div>

      <div className="setup-step">
        <h3>Back-up</h3>
        <p className="hint">Alles staat alleen op dit toestel. Exporteer af en toe.</p>
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button className="btn" onClick={exportData}>Exporteren</button>
          <label className="btn" style={{ textAlign: 'center' }}>
            {busy ? 'Bezig…' : 'Importeren'}
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      <div className="sheet-actions">
        <button className="btn ghost" onClick={onClose}>Annuleren</button>
        <button className="btn primary" onClick={save}>Opslaan</button>
      </div>
    </Sheet>
  )
}

function RuleRow({ rule }: { rule: RecurringRule }) {
  const weekday = WEEKDAYS.find((d) => d.id === rule.weekday)?.label ?? ''
  const cadence = NTH_LABELS[rule.nthOfMonth ?? 0]

  return (
    <li className="shift-row">
      <span className="who">
        <b style={{ color: CATEGORIES[rule.category].color }}>
          {rule.title}
          {rule.owner === 'evie' && ' (Evie)'}
        </b>
        <span>{weekday} · {cadence} · {rule.start}–{rule.end}</span>
      </span>
      <button
        className={`pill${rule.enabled ? ' on' : ''}`}
        onClick={() => db.rules.update(rule.id, { enabled: !rule.enabled })}
      >
        {rule.enabled ? 'Aan' : 'Uit'}
      </button>
    </li>
  )
}
