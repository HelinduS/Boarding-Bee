"use client"

import React, { ReactNode } from "react"

type TabsProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children?: ReactNode
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement> & { children?: ReactNode }
type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string; children?: ReactNode }
type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & { value: string; children?: ReactNode }

export function Tabs({ value, defaultValue, onValueChange, children, className, ...rest }: TabsProps) {
  const [internal, setInternal] = React.useState<string | undefined>(defaultValue)
  const isControlled = typeof value !== "undefined"
  const current = isControlled ? value : internal

  const handleChange = (v: string) => {
    if (!isControlled) setInternal(v)
    onValueChange?.(v)
  }

  // Provide context via simple prop drilling using React.cloneElement where appropriate.
  // We'll render children normally and allow Triggers to call window.dispatchEvent with a custom event.
  React.useEffect(() => {
    const onTab = (e: any) => {
      if (e?.detail?.type === "tabs-select") handleChange(e.detail.value)
    }
    window.addEventListener("__tabs_event", onTab as EventListener)
    return () => window.removeEventListener("__tabs_event", onTab as EventListener)
  }, [value])

  return (
    <div className={className} {...rest} data-current={current}>
      {children}
    </div>
  )
}

export function TabsList({ children, className, ...rest }: TabsListProps) {
  return (
    <div role="tablist" className={className} {...rest}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className, ...rest }: TabsTriggerProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const event = new CustomEvent("__tabs_event", { detail: { type: "tabs-select", value } })
    window.dispatchEvent(event)
    if (rest.onClick) (rest.onClick as any)(e)
  }

  return (
    <button
      role="tab"
      type="button"
      data-value={value}
      onClick={handleClick}
      className={className}
      {...rest}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className, ...rest }: TabsContentProps) {
  // Only render if the parent Tabs has matching data-current or fallback to default behavior.
  const [current, setCurrent] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    const updater = () => {
      const el = document.querySelector('[data-current]') as HTMLElement | null
      setCurrent(el?.dataset?.current)
    }
    updater()
    const onTab = () => updater()
    window.addEventListener("__tabs_event", onTab)
    return () => window.removeEventListener("__tabs_event", onTab)
  }, [])

  if (current && current !== value) return null

  return (
    <div data-value={value} className={className} {...rest}>
      {children}
    </div>
  )
}

export default Tabs
