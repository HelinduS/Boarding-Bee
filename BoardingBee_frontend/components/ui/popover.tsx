"use client"

import React, { ReactNode } from "react"

type PopoverProps = {
  children?: ReactNode
  className?: string
}

export function Popover({ children }: PopoverProps) {
  return <div className="relative inline-block">{children}</div>
}

export function PopoverTrigger({ children, asChild }: { children?: ReactNode; asChild?: boolean }) {
  // asChild means the child element is the trigger; just render the child
  return <>{children}</>
}

export function PopoverContent({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export default Popover
