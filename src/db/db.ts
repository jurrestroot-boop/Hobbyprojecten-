import Dexie, { type EntityTable } from 'dexie'
import { DEFAULT_RULES, DEFAULT_SETTINGS } from '../domain/defaults'
import type {
  Block, Calendar, ExternalEvent, RecurringRule, RuleException, Settings, Shift, WeekPlan,
} from '../domain/types'

/**
 * Alles staat lokaal op je toestel — geen server, geen account. Elke wijziging
 * wordt direct weggeschreven; er is geen opslaan-knop nodig.
 * Backups maak je via Instellingen → Back-up.
 */
class PlannerDB extends Dexie {
  blocks!: EntityTable<Block, 'id'>
  shifts!: EntityTable<Shift, 'id'>
  rules!: EntityTable<RecurringRule, 'id'>
  exceptions!: EntityTable<RuleException, 'id'>
  weekPlans!: EntityTable<WeekPlan, 'id'>
  settings!: EntityTable<Settings, 'id'>
  calendars!: EntityTable<Calendar, 'id'>
  externalEvents!: EntityTable<ExternalEvent, 'id'>

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

    this.version(2)
      .stores({
        calendars: 'id',
        externalEvents: 'id, calendarId, date',
      })
      .upgrade(async (tx) => {
        // Bijgestelde standaarden: kantoor mag ook op donderdag, Enter begint om 18:00.
        const settings = await tx.table('settings').get('settings')
        if (settings && JSON.stringify(settings.officeCandidateDays) === '[1,2,3]') {
          await tx.table('settings').update('settings', { officeCandidateDays: [1, 2, 3, 4] })
        }
        const enter = await tx.table('rules').get('enter-breda')
        if (enter && enter.start === '19:00' && enter.end === '22:00') {
          await tx.table('rules').update('enter-breda', { start: '18:00', end: '21:00' })
        }
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

  // Vraag Android om deze opslag niet op te ruimen bij ruimtegebrek.
  try {
    await navigator.storage?.persist?.()
  } catch {
    // Niet ondersteund: dan blijft de gewone opslag gelden.
  }
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
