import Dexie, { type EntityTable } from 'dexie'
import { DEFAULT_RULES, DEFAULT_SETTINGS } from '../domain/defaults'
import type { Block, RecurringRule, RuleException, Settings, Shift, WeekPlan } from '../domain/types'

/**
 * Alles staat lokaal op je toestel — geen server, geen account.
 * Backups maak je via Instellingen → Exporteren.
 */
class PlannerDB extends Dexie {
  blocks!: EntityTable<Block, 'id'>
  shifts!: EntityTable<Shift, 'id'>
  rules!: EntityTable<RecurringRule, 'id'>
  exceptions!: EntityTable<RuleException, 'id'>
  weekPlans!: EntityTable<WeekPlan, 'id'>
  settings!: EntityTable<Settings, 'id'>

  constructor() {
    super('weekplanner')
    this.version(1).stores({
      blocks: 'id, date, category',
      shifts: 'id, date',
      rules: 'id, weekday',
      exceptions: 'id, ruleId, date',
      weekPlans: 'id',
      settings: 'id',
    })
  }
}

export const db = new PlannerDB()

/** Zet de vaste afspraken en instellingen klaar bij de allereerste start. */
export async function seed(): Promise<void> {
  await db.transaction('rw', db.settings, db.rules, async () => {
    if (!(await db.settings.get('settings'))) {
      await db.settings.add(DEFAULT_SETTINGS)
    }
    if ((await db.rules.count()) === 0) {
      await db.rules.bulkAdd(DEFAULT_RULES)
    }
  })
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
