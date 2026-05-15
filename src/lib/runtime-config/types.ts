export type RuntimeSportType = 'running' | 'cycling'

export interface RuntimeGoals {
  monthlyDistance: number
  monthlyDuration: number
  weeklyDistance: number
  weeklyDuration: number
}

export interface PublicRuntimeConfig {
  goals: Record<RuntimeSportType, RuntimeGoals>
  mapStyle: string
  updatedAt: string | null
}

export const DEFAULT_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

export const DEFAULT_PUBLIC_RUNTIME_CONFIG: PublicRuntimeConfig = {
  goals: {
    running: {
      weeklyDistance: 10000,
      monthlyDistance: 50000,
      weeklyDuration: 3600,
      monthlyDuration: 18000,
    },
    cycling: {
      weeklyDistance: 40000,
      monthlyDistance: 160000,
      weeklyDuration: 7200,
      monthlyDuration: 28800,
    },
  },
  mapStyle: DEFAULT_MAP_STYLE,
  updatedAt: null,
}

function numberSetting(
  settings: Record<string, string | undefined>,
  keys: string[],
  fallback: number,
) {
  for (const key of keys) {
    const value = Number(settings[key])
    if (Number.isFinite(value) && value > 0) {
      return value
    }
  }

  return fallback
}

export function normalizePublicRuntimeConfig(
  settings: Record<string, string | undefined>,
  updatedAt: string | null = null,
): PublicRuntimeConfig {
  const defaults = DEFAULT_PUBLIC_RUNTIME_CONFIG

  return {
    goals: {
      running: {
        weeklyDistance: numberSetting(
          settings,
          ['NEXT_PUBLIC_WEEKLY_RUNNING_DISTANCE_GOAL', 'NEXT_PUBLIC_WEEKLY_DISTANCE_GOAL'],
          defaults.goals.running.weeklyDistance,
        ),
        monthlyDistance: numberSetting(
          settings,
          ['NEXT_PUBLIC_MONTHLY_RUNNING_DISTANCE_GOAL', 'NEXT_PUBLIC_MONTHLY_DISTANCE_GOAL'],
          defaults.goals.running.monthlyDistance,
        ),
        weeklyDuration: numberSetting(
          settings,
          ['NEXT_PUBLIC_WEEKLY_RUNNING_DURATION_GOAL', 'NEXT_PUBLIC_WEEKLY_DURATION_GOAL'],
          defaults.goals.running.weeklyDuration,
        ),
        monthlyDuration: numberSetting(
          settings,
          ['NEXT_PUBLIC_MONTHLY_RUNNING_DURATION_GOAL', 'NEXT_PUBLIC_MONTHLY_DURATION_GOAL'],
          defaults.goals.running.monthlyDuration,
        ),
      },
      cycling: {
        weeklyDistance: numberSetting(
          settings,
          ['NEXT_PUBLIC_WEEKLY_CYCLING_DISTANCE_GOAL'],
          defaults.goals.cycling.weeklyDistance,
        ),
        monthlyDistance: numberSetting(
          settings,
          ['NEXT_PUBLIC_MONTHLY_CYCLING_DISTANCE_GOAL'],
          defaults.goals.cycling.monthlyDistance,
        ),
        weeklyDuration: numberSetting(
          settings,
          ['NEXT_PUBLIC_WEEKLY_CYCLING_DURATION_GOAL'],
          defaults.goals.cycling.weeklyDuration,
        ),
        monthlyDuration: numberSetting(
          settings,
          ['NEXT_PUBLIC_MONTHLY_CYCLING_DURATION_GOAL'],
          defaults.goals.cycling.monthlyDuration,
        ),
      },
    },
    mapStyle: settings.NEXT_PUBLIC_MAP_STYLE || defaults.mapStyle,
    updatedAt,
  }
}
