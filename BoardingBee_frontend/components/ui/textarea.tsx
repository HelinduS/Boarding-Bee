"use client";
import * as React from "react";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return <textarea ref={ref} className={`border p-2 rounded w-full ${className}`} {...props} />;
});
Textarea.displayName = "Textarea";
