/** Alle datums zijn 'YYYY-MM-DD', alle tijden 'HH:mm', altijd lokale tijd. */
export type DateStr = string
export type TimeStr = string

/** ISO-weekdag: 1 = maandag ... 7 = zondag. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

/** Waar de uren van een blok naartoe tellen. Null = telt niet mee voor Delta. */
export type HourTarget = 'stageopdracht' | 'schoolstage' | null

export type CategoryId =
  | 'stageopdracht'
  | 'schoolstage'
  | 'school'
  | 'evie'
  | 'prive'

export type LocationId = 'kantoor' | 'thuis' | 'school' | 'elders'

export interface Block {
  id: string
  date: DateStr
  start: TimeStr
  end: TimeStr
  title: string
  category: CategoryId
  location?: LocationId
  note?: string
  /** Gezet als dit blok een uitgewerkte versie van een vaste afspraak is. */
  fromRuleId?: string
}

/** Van wie een vaste afspraak is. Die van Evie vullen jouw agenda niet, maar
 *  maken haar onbeschikbaar — zoals paardrijden op donderdagavond. */
export type Owner = 'jurre' | 'evie'

/** Een vaste, terugkerende afspraak. Wordt per week uitgeklapt. */
export interface RecurringRule {
  id: string
  title: string
  owner: Owner
  category: CategoryId
  weekday: Weekday
  /** 1 = eerste van de maand, 2 = tweede, ... Null of undefined = elke week. */
  nthOfMonth?: number | null
  start: TimeStr
  end: TimeStr
  location?: LocationId
  enabled: boolean
}

/** Een vaste afspraak die op één specifieke datum niet doorgaat. */
export interface RuleException {
  id: string // `${ruleId}:${date}`
  ruleId: string
  date: DateStr
}

export type ShiftType = 'dag' | 'avond' | 'nacht' | 'anders' | 'vast'

/** Een dienst van Evie, of een vaste afspraak van haar. */
export interface Shift {
  id: string
  date: DateStr
  start: TimeStr
  end: TimeStr
  type: ShiftType
  title?: string
  note?: string
  /** Gezet als deze bezetting uit een vaste afspraak komt. */
  fromRuleId?: string
}

/** Per week vastgelegde keuzes. */
export interface WeekPlan {
  /** ISO-week-sleutel, bijv. '2026-W37'. */
  id: string
  /** Datums waarop je naar kantoor Middelburg gaat. */
  officeDays: DateStr[]
  /** Gezet zodra je de weekstart-wizard hebt afgerond. */
  plannedAt?: string
}

export interface Settings {
  id: 'settings'
  targets: { stageopdracht: number; schoolstage: number }
  /** Hoe vaak per week je op kantoor Middelburg moet zijn. */
  officeDaysRequired: number
  /** Uit welke weekdagen je die kantoordagen mag kiezen. */
  officeCandidateDays: Weekday[]
  dayStart: TimeStr
  dayEnd: TimeStr
  /** Vanaf dit tijdstip telt het als 'avond' voor de Evie-signalering. */
  eveningStart: TimeStr
}
