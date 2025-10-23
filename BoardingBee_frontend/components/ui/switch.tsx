"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type SwitchProps = Readonly<{
  checked: boolean
  onCheckedChangeAction: (v: boolean) => void
  className?: string
}>

export function Switch({ checked, onCheckedChangeAction, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChangeAction(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors duration-200",
        checked ? "bg-indigo-600" : "bg-slate-200",
        "hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  )
}
