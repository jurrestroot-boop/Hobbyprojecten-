import type { Block, DateStr, RecurringRule, RuleException, Shift } from './types'
import { isoWeekday, nthWeekdayOfMonth } from './time'

function appliesOn(rule: RecurringRule, date: DateStr): boolean {
  if (!rule.enabled) return false
  if (isoWeekday(date) !== rule.weekday) return false
  if (rule.nthOfMonth != null && nthWeekdayOfMonth(date) !== rule.nthOfMonth) return false
  return true
}

export function occurrenceId(ruleId: string, date: DateStr): string {
  return `rule:${ruleId}:${date}`
}

/**
 * Klapt de vaste afspraken uit over een reeks datums. Afspraken van Evie
 * komen terug als bezetting, die van jou als blokken in je agenda.
 * Een uitzondering (afgezegd) of een al uitgewerkt blok onderdrukt de afspraak.
 */
export function expandRules(
  rules: RecurringRule[],
  exceptions: RuleException[],
  dates: DateStr[],
  materialised: Block[] = [],
): { blocks: Block[]; evieBusy: Shift[] } {
  const skipped = new Set(exceptions.map((e) => `${e.ruleId}:${e.date}`))
  for (const b of materialised) {
    if (b.fromRuleId) skipped.add(`${b.fromRuleId}:${b.date}`)
  }

  const blocks: Block[] = []
  const evieBusy: Shift[] = []

  for (const date of dates) {
    for (const rule of rules) {
      if (!appliesOn(rule, date)) continue
      if (skipped.has(`${rule.id}:${date}`)) continue

      if (rule.owner === 'evie') {
        evieBusy.push({
          id: occurrenceId(rule.id, date),
          date,
          start: rule.start,
          end: rule.end,
          type: 'vast',
          title: rule.title,
          fromRuleId: rule.id,
        })
      } else {
        blocks.push({
          id: occurrenceId(rule.id, date),
          date,
          start: rule.start,
          end: rule.end,
          title: rule.title,
          category: rule.category,
          location: rule.location,
          fromRuleId: rule.id,
        })
      }
    }
  }

  return { blocks, evieBusy }
}
