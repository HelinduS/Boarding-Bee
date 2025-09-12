import * as React from "react"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}

export function Avatar({ className, children, ...props }: AvatarProps) {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  )
}

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export function AvatarImage(props: AvatarImageProps) {
  return (
    <img
      {...props}
      className={`object-cover w-full h-full`}
    />
  )
}

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string
  children?: React.ReactNode
}

export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  return (
    <span
      className={`flex items-center justify-center w-full h-full bg-muted text-muted-foreground ${className ?? ""}`}
      {...props}
    >
      {children}
    </span>
  )
}