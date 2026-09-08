import { useState } from 'react'
import { Sheet } from './Sheet'
import { CATEGORIES, CATEGORY_IDS, LOCATIONS } from '../domain/categories'
import { db, newId } from '../db/db'
import { durationHours, formatHours } from '../domain/time'
import type { Block, CategoryId, DateStr, LocationId } from '../domain/types'

interface Props {
  block: Block | null
  date: DateStr
  onClose: () => void
}

/** Een blok komt uit een vaste afspraak zolang het nog geen eigen id heeft. */
function isOccurrence(block: Block | null): boolean {
  return !!block && block.id.startsWith('rule:')
}

export function BlockSheet({ block, date, onClose }: Props) {
  const [title, setTitle] = useState(block?.title ?? '')
  const [category, setCategory] = useState<CategoryId>(block?.category ?? 'projectopdracht')
  const [start, setStart] = useState(block?.start ?? '09:00')
  const [end, setEnd] = useState(block?.end ?? '12:00')
  const [location, setLocation] = useState<LocationId | ''>(block?.location ?? '')
  const [note, setNote] = useState(block?.note ?? '')

  const hours = durationHours(start, end)
  const fromRule = isOccurrence(block)

  async function save() {
    const record: Block = {
      id: fromRule || !block ? newId('blk') : block.id,
      date: block?.date ?? date,
      start,
      end,
      title: title.trim() || CATEGORIES[category].label,
      category,
      location: location || undefined,
      note: note.trim() || undefined,
      // Bewaar de herkomst, zodat de vaste afspraak niet dubbel verschijnt.
      fromRuleId: fromRule ? block!.id.split(':')[1] : block?.fromRuleId,
    }
    await db.blocks.put(record)
    onClose()
  }

  async function remove() {
    if (!block) return
    if (fromRule) {
      // Vaste afspraak: alleen deze ene keer laten vervallen.
      const ruleId = block.id.split(':')[1]
      await db.exceptions.put({ id: `${ruleId}:${block.date}`, ruleId, date: block.date })
    } else {
      await db.blocks.delete(block.id)
    }
    onClose()
  }

  return (
    <Sheet title={block ? 'Blok aanpassen' : 'Blok toevoegen'} onClose={onClose}>
      <div className="field">
        <label htmlFor="blk-title">Wat ga je doen</label>
        <input
          id="blk-title"
          value={title}
          placeholder={CATEGORIES[category].label}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Categorie</label>
        <div className="pills">
          {CATEGORY_IDS.map((id) => (
            <button
              key={id}
              className={`pill${category === id ? ' on' : ''}`}
              style={{ '--pc': CATEGORIES[id].color } as React.CSSProperties}
              onClick={() => setCategory(id)}
            >
              {CATEGORIES[id].label}
            </button>
          ))}
        </div>
        <p className="hint">
          {CATEGORIES[category].target
            ? CATEGORIES[category].target === 'stageopdracht'
              ? 'Telt mee voor je stageopdracht-uren (school).'
              : 'Telt mee voor je projectopdracht-uren (Smart Consultant).'
            : 'Telt niet mee voor je Delta-uren.'}
        </p>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="blk-start">Van</label>
          <input id="blk-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="blk-end">Tot</label>
          <input id="blk-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <p className="hint">{formatHours(hours)} uur</p>

      <div className="field">
        <label htmlFor="blk-loc">Waar</label>
        <select id="blk-loc" value={location} onChange={(e) => setLocation(e.target.value as LocationId | '')}>
          <option value="">Niet opgegeven</option>
          {Object.entries(LOCATIONS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="blk-note">Notitie</label>
        <textarea id="blk-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      {fromRule && (
        <p className="hint">
          Dit komt uit een vaste afspraak. Aanpassen geldt alleen voor deze week.
        </p>
      )}

      <div className="sheet-actions">
        {block && (
          <button className="btn danger" onClick={remove}>
            {fromRule ? 'Deze week overslaan' : 'Verwijderen'}
          </button>
        )}
        <button className="btn ghost" onClick={onClose}>Annuleren</button>
        <button className="btn primary" onClick={save} disabled={hours <= 0}>Opslaan</button>
      </div>
    </Sheet>
  )
}
