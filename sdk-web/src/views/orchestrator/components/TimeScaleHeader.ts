import { generateTimeMarkers, TimeScaleZoomLevel, TimeMarker } from '../../../utils/timeScaleUtils'

export interface TimeScaleHeaderProps {
  baseTime: string
  totalDurationSeconds: number
  zoomLevel?: TimeScaleZoomLevel
  pixelsPerSecond?: number
}

export class TimeScaleHeader {
  constructor(private readonly props: TimeScaleHeaderProps) {}

  getMarkers(): TimeMarker[] {
    return generateTimeMarkers(
      this.props.baseTime,
      this.props.totalDurationSeconds,
      this.props.zoomLevel || '15m',
      this.props.pixelsPerSecond || 1
    )
  }

  render(): string {
    const markers = this.getMarkers()
    const ticksHtml = markers
      .map(
        (m) =>
          `<div class="marker-tick" style="left: ${m.pixelOffset}px;">
            <span class="marker-label">${m.label}</span>
          </div>`
      )
      .join('\n')

    return `
      <div class="swimlane-time-scale-header" style="position: relative; width: 100%;">
        ${ticksHtml}
      </div>
    `.trim()
  }
}
