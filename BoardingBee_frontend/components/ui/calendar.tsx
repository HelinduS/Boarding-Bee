"use client"

import React from "react"

type CalendarProps = {
  mode?: "single" | "range"
  selected?: Date | undefined
  onSelect?: (date: Date) => void
  className?: string
  min?: string
  max?: string
}


export function Calendar({ mode = "single", selected, onSelect, className, min, max }: CalendarProps) {
  const formatForInput = (d?: Date) => (d ? d.toISOString().slice(0, 10) : "")

  return (
    <div className={className}>
      {/* Minimal calendar: an input type=date which satisfies the ReportsSection usage */}
      <input
        type="date"
        value={formatForInput(selected)}
        min={min}
        max={max}
        onChange={(e) => {
          const v = e.target.value
          if (!v) return onSelect?.(undefined as any)
          const date = new Date(v + "T00:00:00")
          onSelect?.(date)
        }}
        className="w-full p-2 border rounded bg-transparent"
      />
      {mode === "range" && <div className="text-xs text-muted-foreground mt-1">Range mode (basic)</div>}
    </div>
  )
}

export default Calendar
