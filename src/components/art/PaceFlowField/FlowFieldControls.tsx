'use client'

import { useAtom } from 'jotai'
import { Pause, Play, RotateCcw } from 'lucide-react'

import { flowFieldSettingsAtom } from '@/stores/art'

import { ArtControlPanel, ControlRow, SliderControl, ToggleButton } from '../shared/ArtControlPanel'

/**
 * Control panel for flow field visualization settings
 */
export function FlowFieldControls() {
  const [settings, setSettings] = useAtom(flowFieldSettingsAtom)

  const togglePlaying = () => {
    setSettings((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
  }

  const handleSpeedChange = (speed: number) => {
    setSettings((prev) => ({ ...prev, speed }))
  }

  const handleParticleCountChange = (particleCount: number) => {
    setSettings((prev) => ({ ...prev, particleCount }))
  }

  const handleTrailLengthChange = (trailLength: number) => {
    setSettings((prev) => ({ ...prev, trailLength }))
  }

  const toggleColorByPace = () => {
    setSettings((prev) => ({ ...prev, colorByPace: !prev.colorByPace }))
  }

  const resetSettings = () => {
    setSettings({
      isPlaying: false,
      speed: 1,
      particleCount: 300,
      trailLength: 20,
      colorByPace: true,
    })
  }

  return (
    <ArtControlPanel title="流场设置">
      {/* Play/Pause button */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlaying}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            settings.isPlaying ? 'bg-orange text-white' : 'bg-blue text-white'
          }`}
        >
          {settings.isPlaying ? (
            <>
              <Pause className="h-4 w-4" />
              暂停
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              播放
            </>
          )}
        </button>
      </div>

      {/* Speed control */}
      <ControlRow label="流动速度">
        <SliderControl
          value={settings.speed}
          min={0.5}
          max={3}
          step={0.1}
          onChange={handleSpeedChange}
          formatValue={(v) => `${v.toFixed(1)}x`}
        />
      </ControlRow>

      {/* Particle count control */}
      <ControlRow label="粒子数量">
        <SliderControl
          value={settings.particleCount}
          min={100}
          max={1000}
          step={50}
          onChange={handleParticleCountChange}
          formatValue={(v) => `${v}`}
        />
      </ControlRow>

      {/* Trail length control */}
      <ControlRow label="轨迹长度">
        <SliderControl
          value={settings.trailLength}
          min={5}
          max={50}
          step={5}
          onChange={handleTrailLengthChange}
          formatValue={(v) => `${v}`}
        />
      </ControlRow>

      {/* Toggle options */}
      <div className="flex flex-wrap gap-2 pt-2">
        <ToggleButton active={settings.colorByPace} onClick={toggleColorByPace}>
          配速着色
        </ToggleButton>
        <button
          onClick={resetSettings}
          className="text-label/60 hover:text-label flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          重置
        </button>
      </div>
    </ArtControlPanel>
  )
}
