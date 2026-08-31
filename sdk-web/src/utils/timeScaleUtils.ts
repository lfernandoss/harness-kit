export type TimeScaleZoomLevel = '1m' | '5m' | '15m' | '1h' | 'auto'

export interface TimeMarker {
  timestamp: string
  label: string
  pixelOffset: number
}

export function calculateTimelineOffset(timestamp: string, baseTime: string, scale: number = 1): number {
  const tTime = new Date(timestamp).getTime()
  const bTime = new Date(baseTime).getTime()
  if (isNaN(tTime) || isNaN(bTime) || tTime <= bTime) {
    return 0
  }
  const seconds = (tTime - bTime) / 1000
  return Math.round(seconds * scale)
}

export function calculateCardWidth(
  startTime: string,
  endTime?: string,
  scale: number = 1,
  minWidth: number = 48
): number {
  const sTime = new Date(startTime).getTime()
  const eTime = endTime ? new Date(endTime).getTime() : Date.now()
  if (isNaN(sTime) || isNaN(eTime) || eTime <= sTime) {
    return minWidth
  }
  const seconds = (eTime - sTime) / 1000
  const calculated = Math.round(seconds * scale)
  return Math.max(minWidth, calculated)
}

export function generateTimeMarkers(
  baseTime: string,
  totalDurationSeconds: number,
  zoomLevel: TimeScaleZoomLevel = '15m',
  scale: number = 1
): TimeMarker[] {
  let intervalSeconds = 900 // default 15m
  if (zoomLevel === '1m') intervalSeconds = 60
  if (zoomLevel === '5m') intervalSeconds = 300
  if (zoomLevel === '1h') intervalSeconds = 3600

  const markers: TimeMarker[] = []
  const baseMs = new Date(baseTime).getTime()

  for (let sec = 0; sec <= totalDurationSeconds; sec += intervalSeconds) {
    const markerDate = new Date(baseMs + sec * 1000)
    const hours = markerDate.getHours().toString().padStart(2, '0')
    const mins = markerDate.getMinutes().toString().padStart(2, '0')
    const secs = markerDate.getSeconds().toString().padStart(2, '0')
    const label = intervalSeconds < 60 ? `${hours}:${mins}:${secs}` : `${hours}:${mins}`

    markers.push({
      timestamp: markerDate.toISOString(),
      label,
      pixelOffset: Math.round(sec * scale),
    })
  }

  return markers
}
