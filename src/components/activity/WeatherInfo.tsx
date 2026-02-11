/**
 * WeatherInfo Component
 *
 * Displays weather data in the activity detail stats row.
 * Parses the JSON weatherData string and renders temperature + description with emoji.
 */

'use client'

interface WeatherInfoProps {
  weatherDataJson: string
}

interface ParsedWeather {
  temperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
  description: string
}

/**
 * WMO weather code → emoji mapping
 */
function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 57) return '🌦️'
  if (code <= 65) return '🌧️'
  if (code <= 67) return '🧊'
  if (code <= 77) return '🌨️'
  if (code <= 82) return '🌧️'
  if (code <= 86) return '🌨️'
  if (code >= 95) return '⛈️'
  return '🌡️'
}

export function WeatherInfo({ weatherDataJson }: WeatherInfoProps) {
  let weather: ParsedWeather | null = null

  try {
    weather = JSON.parse(weatherDataJson) as ParsedWeather
  } catch {
    return null
  }

  if (!weather || weather.temperature == null) {
    return null
  }

  const emoji = getWeatherEmoji(weather.weatherCode)

  return (
    <div className="flex flex-col items-center">
      <span className="text-label text-lg font-semibold tabular-nums sm:text-xl">
        {emoji} {weather.temperature}°
      </span>
      <span className="text-label/50 text-xs">{weather.description}</span>
    </div>
  )
}
