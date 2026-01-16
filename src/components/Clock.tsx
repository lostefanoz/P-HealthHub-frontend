import { memo, useEffect, useState } from 'react'

type ClockProps = {
  locale?: string
  timeZone?: string
  prefix?: string
  intervalMs?: number
}

function Clock({ locale = 'it-IT', timeZone = 'Europe/Rome', prefix = '', intervalMs = 60_000 }: ClockProps) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const tick = () => setValue(new Date().toLocaleTimeString(locale, { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }))
    tick()
    const id = window.setInterval(tick, intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, locale, timeZone])

  return <span className="label">{prefix ? `${prefix} ${value}` : value}</span>
}

export default memo(Clock)
