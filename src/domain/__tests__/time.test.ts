import { describe, expect, it } from 'vitest'
import { durationHours, isoWeekday, nthWeekdayOfMonth, overlaps, weekDates, weekKey } from '../time'
import { expandRules } from '../recurring'
import { DEFAULT_RULES } from '../defaults'

describe('tijdrekenen', () => {
  it('kent de ISO-week rond de jaarwisseling', () => {
    expect(weekKey('2026-12-31')).toBe('2026-W53')
    expect(weekKey('2027-01-01')).toBe('2026-W53')
    expect(weekKey('2027-01-04')).toBe('2027-W01')
  })

  it('begint de week op maandag', () => {
    expect(weekDates('2026-09-10')[0]).toBe('2026-09-07')
    expect(isoWeekday('2026-09-13')).toBe(7)
  })

  it('telt een dienst die over middernacht loopt door', () => {
    expect(durationHours('23:00', '07:15')).toBeCloseTo(8.25)
    expect(overlaps('23:00', '07:15', '17:30', '23:00')).toBe(false)
    expect(overlaps('13:00', '21:00', '17:30', '23:00')).toBe(true)
  })

  it('weet welke maandag de eerste van de maand is', () => {
    expect(nthWeekdayOfMonth('2026-09-07')).toBe(1)
    expect(nthWeekdayOfMonth('2026-09-14')).toBe(2)
  })
})

describe('vaste afspraken', () => {
  const dates = weekDates('2026-09-07')

  it('zet Enter Breda alleen op de eerste maandag', () => {
    const week1 = expandRules(DEFAULT_RULES, [], dates)
    const week2 = expandRules(DEFAULT_RULES, [], weekDates('2026-09-14'))
    expect(week1.blocks.some((b) => b.title === 'Enter Breda')).toBe(true)
    expect(week2.blocks.some((b) => b.title === 'Enter Breda')).toBe(false)
  })

  it('maakt van paardrijden een bezetting van Evie, geen blok van jou', () => {
    const { blocks, evieBusy } = expandRules(DEFAULT_RULES, [], dates)
    expect(evieBusy.map((s) => s.title)).toEqual(['Paardrijden'])
    expect(blocks.some((b) => b.title === 'Paardrijden')).toBe(false)
  })

  it('stopt school na de einddatum', () => {
    const rules = DEFAULT_RULES.map((r) => (r.id === 'school-donderdag' ? { ...r, validUntil: '2026-09-30' } : r))
    expect(expandRules(rules, [], weekDates('2026-09-21')).blocks.some((b) => b.title === 'School')).toBe(true)
    expect(expandRules(rules, [], weekDates('2026-10-05')).blocks.some((b) => b.title === 'School')).toBe(false)
  })

  it('laat een afgezegde keer weg', () => {
    const { blocks } = expandRules(DEFAULT_RULES, [{ id: 'x', ruleId: 'school-donderdag', date: '2026-09-10' }], dates)
    expect(blocks.some((b) => b.title === 'School')).toBe(false)
  })
})
