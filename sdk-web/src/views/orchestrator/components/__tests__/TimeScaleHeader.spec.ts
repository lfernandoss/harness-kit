import { describe, it, expect } from 'vitest'
import {
  calculateTimelineOffset,
  calculateCardWidth,
  generateTimeMarkers,
} from '../../../../utils/timeScaleUtils'
import { TimeScaleHeader } from '../TimeScaleHeader'

describe('TimeScale Utilities & TimeScaleHeader Component', () => {
  const baseTime = '2026-08-31T10:00:00.000Z'

  it('calculateTimelineOffset should calculate exact horizontal pixel offset', () => {
    // 5 minutes later = 300 seconds. With 1px / sec = 300px
    const targetTime = '2026-08-31T10:05:00.000Z'
    const offset = calculateTimelineOffset(targetTime, baseTime, 1)
    expect(offset).toBe(300)
  })

  it('calculateTimelineOffset should clamp to 0 if target is before base time', () => {
    const targetTime = '2026-08-31T09:59:00.000Z'
    const offset = calculateTimelineOffset(targetTime, baseTime, 1)
    expect(offset).toBe(0)
  })

  it('calculateCardWidth should enforce minimum bounding width', () => {
    const startTime = '2026-08-31T10:00:00.000Z'
    const endTime = '2026-08-31T10:00:05.000Z' // 5s -> 5px with 1 scale, but min is 48px
    const width = calculateCardWidth(startTime, endTime, 1, 48)
    expect(width).toBe(48)

    const longerEndTime = '2026-08-31T10:02:00.000Z' // 120s -> 120px
    const longerWidth = calculateCardWidth(startTime, longerEndTime, 1, 48)
    expect(longerWidth).toBe(120)
  })

  it('generateTimeMarkers should generate tick labels according to zoom level', () => {
    const markers = generateTimeMarkers(baseTime, 3600, '15m', 1)
    expect(markers.length).toBeGreaterThan(1)
    expect(markers[0].label).toBeDefined()
    expect(markers[0].pixelOffset).toBe(0)
  })

  it('TimeScaleHeader should render time markers properly', () => {
    const header = new TimeScaleHeader({
      baseTime,
      totalDurationSeconds: 3600,
      zoomLevel: '15m',
      pixelsPerSecond: 1,
    })

    const html = header.render()
    expect(html).toContain('swimlane-time-scale-header')
    expect(html).toContain('marker-tick')
  })
})
