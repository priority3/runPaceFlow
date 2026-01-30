'use client'

import { useAtom } from 'jotai'
import { RotateCcw } from 'lucide-react'

import { constellationSettingsAtom } from '@/stores/art'

import { ArtControlPanel, ControlRow, SliderControl, ToggleButton } from '../shared/ArtControlPanel'

/**
 * Control panel for constellation visualization settings
 */
export function ConstellationControls() {
  const [settings, setSettings] = useAtom(constellationSettingsAtom)

  const toggleLabels = () => {
    setSettings((prev) => ({ ...prev, showLabels: !prev.showLabels }))
  }

  const toggleConnections = () => {
    setSettings((prev) => ({ ...prev, showConnections: !prev.showConnections }))
  }

  const toggleTwinkle = () => {
    setSettings((prev) => ({ ...prev, twinkle: !prev.twinkle }))
  }

  const handleStarSizeChange = (starSize: number) => {
    setSettings((prev) => ({ ...prev, starSize }))
  }

  const resetSettings = () => {
    setSettings({
      showLabels: true,
      showConnections: true,
      starSize: 2,
      twinkle: true,
      rotationX: 0,
      rotationY: 0,
    })
  }

  return (
    <ArtControlPanel title="星座设置">
      {/* Star size control */}
      <ControlRow label="星星大小">
        <SliderControl
          value={settings.starSize}
          min={1}
          max={5}
          step={0.5}
          onChange={handleStarSizeChange}
          formatValue={(v) => `${v.toFixed(1)}x`}
        />
      </ControlRow>

      {/* Toggle options */}
      <div className="flex flex-wrap gap-2 pt-2">
        <ToggleButton active={settings.showLabels} onClick={toggleLabels}>
          公里标签
        </ToggleButton>
        <ToggleButton active={settings.showConnections} onClick={toggleConnections}>
          连接线
        </ToggleButton>
        <ToggleButton active={settings.twinkle} onClick={toggleTwinkle}>
          闪烁效果
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
