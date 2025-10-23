
"use client"

import React, { ReactNode, createContext, useContext } from "react"

type TabsProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children?: ReactNode
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement> & { children?: ReactNode }
type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string; children?: ReactNode }
type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & { value: string; children?: ReactNode }

type TabsContextType = {
  current: string | undefined
  setCurrent: (v: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

export function Tabs({ value, defaultValue, onValueChange, children, className, ...rest }: TabsProps) {
  const [internal, setInternal] = React.useState<string | undefined>(defaultValue)
  const isControlled = typeof value !== "undefined"
  const current = isControlled ? value : internal

  const setCurrent = (v: string) => {
    if (!isControlled) setInternal(v)
    onValueChange?.(v)
  }

  return (
    <TabsContext.Provider value={{ current, setCurrent }}>
      <div className={className} {...rest} data-current={current}>
        {children}
      </div>
    </TabsContext.Provider>
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
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error("TabsTrigger must be used within a Tabs")
  const { current, setCurrent } = ctx
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setCurrent(value)
    if (rest.onClick) (rest.onClick as any)(e)
  }
  return (
    <button
      role="tab"
      type="button"
      data-value={value}
      aria-selected={current === value}
      data-state={current === value ? "active" : undefined}
      onClick={handleClick}
      className={className}
      {...rest}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className, ...rest }: TabsContentProps) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error("TabsContent must be used within a Tabs")
  const { current } = ctx
  if (current && current !== value) return null
  return (
    <div data-value={value} className={className} {...rest}>
      {children}
    </div>
  )
}

export default Tabs
