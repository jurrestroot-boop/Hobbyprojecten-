import type { RecurringRule, Settings } from './types'

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  targets: { stageopdracht: 20, schoolstage: 20 },
  officeDaysRequired: 2,
  officeCandidateDays: [1, 2, 3], // maandag, dinsdag, woensdag
  dayStart: '08:00',
  dayEnd: '22:30',
  eveningStart: '17:30',
}

/** Jouw vaste punten in de week. Aan te passen bij Instellingen. */
export const DEFAULT_RULES: RecurringRule[] = [
  {
    id: 'school-donderdag',
    title: 'School',
    owner: 'jurre',
    category: 'school',
    weekday: 4,
    nthOfMonth: null,
    start: '09:00',
    end: '17:00',
    location: 'school',
    enabled: true,
  },
  {
    id: 'enter-breda',
    title: 'Enter Breda',
    owner: 'jurre',
    category: 'prive',
    weekday: 1,
    nthOfMonth: 1, // eerste maandag van de maand
    start: '19:00',
    end: '22:00',
    location: 'elders',
    enabled: true,
  },
  {
    id: 'evie-paardrijden',
    title: 'Paardrijden',
    owner: 'evie',
    category: 'evie',
    weekday: 4,
    nthOfMonth: null,
    start: '19:00',
    end: '21:30',
    enabled: true,
  },
]

/** Hoe een dienst heet in de interface. */
export const SHIFT_LABELS: Record<string, string> = {
  dag: 'Dagdienst',
  avond: 'Avonddienst',
  nacht: 'Nachtdienst',
  anders: 'Dienst',
  vast: 'Vast',
}

/** Snelknoppen voor Evie's diensten, zodat je geen tijden hoeft te typen. */
export const SHIFT_PRESETS: { type: 'dag' | 'avond' | 'nacht'; label: string; start: string; end: string }[] = [
  { type: 'dag', label: 'Dagdienst', start: '07:00', end: '15:30' },
  { type: 'avond', label: 'Avonddienst', start: '14:30', end: '23:00' },
  { type: 'nacht', label: 'Nachtdienst', start: '23:00', end: '07:15' },
]
