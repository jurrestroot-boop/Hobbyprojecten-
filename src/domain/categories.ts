import type { CategoryId, HourTarget, LocationId } from './types'

interface CategoryMeta {
  label: string
  short: string
  color: string
  target: HourTarget
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  // Delta bestaat uit twee helften: de projectopdracht vanuit Smart Consultant
  // en de stageopdracht vanuit school. Elk 20 uur per week.
  projectopdracht: {
    label: 'Projectopdracht',
    short: 'Project',
    color: '#3b6fd4',
    target: 'projectopdracht',
  },
  stageopdracht: {
    label: 'Stageopdracht',
    short: 'Stage',
    color: '#2f9e7d',
    target: 'stageopdracht',
  },
  school: {
    label: 'School',
    short: 'School',
    color: '#7a5cc4',
    // De 8 uur op school vallen binnen de 20 uur stageopdracht.
    target: 'stageopdracht',
  },
  evie: {
    label: 'Evie',
    short: 'Evie',
    color: '#d4568c',
    target: null,
  },
  prive: {
    label: 'Privé',
    short: 'Privé',
    color: '#8a8f98',
    target: null,
  },
}

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[]

export const LOCATIONS: Record<LocationId, string> = {
  kantoor: 'Kantoor Middelburg',
  thuis: 'Thuis',
  school: 'School',
  elders: 'Elders',
}
