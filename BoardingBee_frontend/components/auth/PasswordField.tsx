'use client';
import React, { useState, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative w-full">
        {label && <label className="block text-sm font-medium text-foreground mb-1">{label}</label>}
        <Input
          type={show ? "text" : "password"}
          className={className}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  }
);
PasswordField.displayName = "PasswordField";