import { CATEGORIES } from './categories'
import type { Block, Settings } from './types'
import { durationHours } from './time'

export interface TargetBalance {
  key: 'projectopdracht' | 'stageopdracht'
  label: string
  planned: number
  target: number
  /** Positief = je hebt uren over gepland, negatief = je komt tekort. */
  delta: number
}

export interface WeekBalance {
  targets: TargetBalance[]
  plannedTotal: number
  targetTotal: number
  delta: number
}

export function weekBalance(blocks: Block[], settings: Settings): WeekBalance {
  const planned = { projectopdracht: 0, stageopdracht: 0 }

  for (const block of blocks) {
    const target = CATEGORIES[block.category].target
    if (target) planned[target] += durationHours(block.start, block.end)
  }

  const targets: TargetBalance[] = [
    {
      key: 'projectopdracht',
      label: CATEGORIES.projectopdracht.label,
      planned: planned.projectopdracht,
      target: settings.targets.projectopdracht,
      delta: planned.projectopdracht - settings.targets.projectopdracht,
    },
    {
      key: 'stageopdracht',
      label: CATEGORIES.stageopdracht.label,
      planned: planned.stageopdracht,
      target: settings.targets.stageopdracht,
      delta: planned.stageopdracht - settings.targets.stageopdracht,
    },
  ]

  const plannedTotal = targets.reduce((sum, t) => sum + t.planned, 0)
  const targetTotal = targets.reduce((sum, t) => sum + t.target, 0)

  return { targets, plannedTotal, targetTotal, delta: plannedTotal - targetTotal }
}
