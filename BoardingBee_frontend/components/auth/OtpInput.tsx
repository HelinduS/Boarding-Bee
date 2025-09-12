'use client';
import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;                           // controlled string, e.g., "12__" or "1234"
  onChange: (value: string) => void;       // send full OTP string (padded to length)
  onComplete?: (value: string) => void;    // called when all digits filled
  disabled?: boolean;
  className?: string;                      // container classes
  inputClassName?: string;                 // per-digit classes
}

export function OtpInput({
  length = 4,
  value,
  onChange,
  onComplete,
  disabled = false,
  className,
  inputClassName,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeInput, setActiveInput] = useState(0);

  // Keep refs array sized to length
  useEffect(() => {
    inputRefs.current = Array.from({ length }, (_, i) => inputRefs.current[i] || null);
  }, [length]);

  // Auto-focus first box on mount/when enabled and empty
  useEffect(() => {
    if (!disabled && value.replace(/\D/g, "").length === 0) {
      inputRefs.current[0]?.focus();
      setActiveInput(0);
    }
  }, [disabled, value]);

  const setDigitAt = (idx: number, digit: string) => {
    const arr = value.split("");
    arr[idx] = digit;
    // ensure fixed length string (missing indices become empty)
    for (let i = 0; i < length; i++) if (arr[i] == null) arr[i] = "";
    return arr.join("").slice(0, length);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const input = e.target.value;
    const digit = input.slice(-1); // last char typed
    if (!/^\d?$/.test(digit)) return; // allow empty or single digit

    const updated = setDigitAt(index, digit || "");
    onChange(updated);

    // Move focus forward on valid digit
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveInput(index + 1);
    }

    // Completed?
    if (updated.replace(/\D/g, "").length === length) {
      onComplete?.(updated);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const currentVal = value[index] || "";
      if (currentVal) {
        // clear current digit
        const updated = setDigitAt(index, "");
        onChange(updated);
      } else if (index > 0) {
        // move left and clear
        const updated = setDigitAt(index - 1, "");
        onChange(updated);
        inputRefs.current[index - 1]?.focus();
        setActiveInput(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveInput(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveInput(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, length);
    if (!digits) return;

    // Fill from start
    let filled = Array.from({ length }, (_, i) => digits[i] ?? "");
    const finalValue = filled.join("");
    onChange(finalValue);

    // Focus last filled cell
    const last = Math.min(digits.length - 1, length - 1);
    if (last >= 0) {
      inputRefs.current[last]?.focus();
      setActiveInput(last);
    }

    if (digits.length === length) onComplete?.(finalValue);
  };

  return (
    <div className={cn("flex justify-center gap-3", className)}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={index === 0 ? handlePaste : undefined}
          onFocus={() => setActiveInput(index)}
          disabled={disabled}
          className={cn(
            "otp-digit",               // your base style (e.g., width/height/border/radius)
            "focus:outline-none",      // keep a11y
            activeInput === index && "border-primary",
            disabled && "bg-gray-100 cursor-not-allowed opacity-70",
            inputClassName
          )}
          aria-label={`Digit ${index + 1}`}
          aria-disabled={disabled || undefined}
          autoComplete="one-time-code"
          pattern="[0-9]*"
        />
      ))}
    </div>
  );
}