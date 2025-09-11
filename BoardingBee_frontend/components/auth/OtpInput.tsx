'use client';
import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  className?: string;        // optional: container extra classes
  inputClassName?: string;   // optional: per-digit extra classes
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

  useEffect(() => {
    inputRefs.current = Array(length).fill(null);
  }, [length]);

  useEffect(() => {
    if (!disabled && inputRefs.current[0]) inputRefs.current[0].focus();
  }, [disabled]);

  useEffect(() => {
    const valueArray = value.split("");
    inputRefs.current.forEach((input, i) => {
      if (input) input.value = valueArray[i] || "";
    });
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value;
    const digit = newValue.slice(-1);
    if (!/^\d*$/.test(digit)) return;

    const newOtp = value.split("");
    newOtp[index] = digit;
    const updated = newOtp.join("");
    onChange(updated);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveInput(index + 1);
    }
    if (updated.length === length) onComplete?.(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        const newOtp = value.split("");
        newOtp[index - 1] = "";
        onChange(newOtp.join(""));
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
    const pasted = e.clipboardData.getData("text/plain").trim();
    const digits = pasted.replace(/\D/g, "").slice(0, length);
    if (digits) {
      onChange(digits.padEnd(length, "").slice(0, length));
      const last = Math.min(digits.length - 1, length - 1);
      if (last >= 0) {
        inputRefs.current[last]?.focus();
        setActiveInput(last);
      }
      if (digits.length === length) onComplete?.(digits);
    }
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
            // 🔥 premium focus/hover from globals.css
            "otp-digit",
            // keep sensible base + accessibility
            "focus:outline-none",
            // compatibility with your theme tokens
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
