'use client'

import { useAtom } from 'jotai'
import { RotateCcw } from 'lucide-react'

import type { FingerprintMode } from '@/stores/art'
import { fingerprintSettingsAtom } from '@/stores/art'

import {
  ArtControlPanel,
  ControlRow,
  SegmentedControl,
  SliderControl,
  ToggleButton,
} from '../shared/ArtControlPanel'

const modeOptions: Array<{ value: FingerprintMode; label: string }> = [
  { value: 'pace', label: '配速' },
  { value: 'heartrate', label: '心率' },
  { value: 'elevation', label: '海拔' },
]

interface FingerprintControlsProps {
  hasHeartRateData: boolean
  hasElevationData: boolean
}

/**
 * Control panel for fingerprint visualization settings
 */
export function FingerprintControls({
  hasHeartRateData,
  hasElevationData,
}: FingerprintControlsProps) {
  const [settings, setSettings] = useAtom(fingerprintSettingsAtom)

  // Filter available modes based on data
  const availableModes = modeOptions.filter((option) => {
    if (option.value === 'heartrate' && !hasHeartRateData) return false
    if (option.value === 'elevation' && !hasElevationData) return false
    return true
  })

  const handleModeChange = (mode: FingerprintMode) => {
    setSettings((prev) => ({ ...prev, mode }))
  }

  const handleRotationChange = (rotation: number) => {
    setSettings((prev) => ({ ...prev, rotation }))
  }

  const handleScaleChange = (scale: number) => {
    setSettings((prev) => ({ ...prev, scale }))
  }

  const toggleRadialLines = () => {
    setSettings((prev) => ({ ...prev, showRadialLines: !prev.showRadialLines }))
  }

  const toggleAnimateRotation = () => {
    setSettings((prev) => ({ ...prev, animateRotation: !prev.animateRotation }))
  }

  const resetSettings = () => {
    setSettings({
      mode: 'pace',
      rotation: 0,
      scale: 1,
      showRadialLines: true,
      animateRotation: false,
    })
  }

  return (
    <ArtControlPanel title="指纹设置">
      {/* Mode selection */}
      {availableModes.length > 1 && (
        <ControlRow label="显示模式">
          <SegmentedControl
            options={availableModes}
            value={settings.mode}
            onChange={handleModeChange}
          />
        </ControlRow>
      )}

      {/* Rotation control */}
      <ControlRow label="旋转角度">
        <SliderControl
          value={settings.rotation}
          min={0}
          max={360}
          step={1}
          onChange={handleRotationChange}
          formatValue={(v) => `${v}°`}
        />
      </ControlRow>

      {/* Scale control */}
      <ControlRow label="缩放">
        <SliderControl
          value={settings.scale}
          min={0.5}
          max={2}
          step={0.1}
          onChange={handleScaleChange}
          formatValue={(v) => `${v.toFixed(1)}x`}
        />
      </ControlRow>

      {/* Toggle options */}
      <div className="flex flex-wrap gap-2 pt-2">
        <ToggleButton active={settings.showRadialLines} onClick={toggleRadialLines}>
          放射线
        </ToggleButton>
        <ToggleButton active={settings.animateRotation} onClick={toggleAnimateRotation}>
          自动旋转
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
