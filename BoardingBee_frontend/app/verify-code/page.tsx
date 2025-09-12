'use client';
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/auth/OtpInput";
import { useCountdown } from "@/hooks/useCountdown";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { authApi } from "@/lib/authApi";

export default function VerifyCodePage() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const email = decodeURIComponent(params.get("email") ?? "");
  const { formatted, isComplete, reset } = useCountdown({ initialSeconds: 60 });

  const handleVerify = async () => {
    if (code.length !== 4) {
      toast.error("Please enter all 4 digits");
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.verifyCode(email, code);
      if (res.ok && res.token) {
        toast.success("Code verified successfully");
        router.push(`/reset-password?email=${encodeURIComponent(email)}&token=${res.token}`);
      } else {
        toast.error("Invalid code. Please try again.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authApi.requestReset(email);
      toast.success("New code sent successfully");
      setCode("");
      reset();
    } catch {
      toast.error("Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (code.length === 4 && !isLoading) handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="bb-bg bb-grid bb-noise min-h-screen flex items-center justify-center px-4 py-16">
      {/* floating blobs */}
      <div className="bb-blob" />
      <div className="bb-blob2" />

      {/* gradient glow frame around the card */}
      <div className="bb-gradient-border bb-glow w-full max-w-md">
        {/* If AuthCard supports className, this adds the glass styling inside the frame */}
        <AuthCard
          className="bb-card-glass"
          title="Verify Your Email"
          subtitle={`Please enter the 4 digit code sent to your email ${email}`}
          showBackButton
          backTo="/forgot-password"
          illustration={
            <div className="bg-primary/10 p-4 rounded-full">
              <Mail size={48} className="text-primary" />
            </div>
          }
        >
          <div className="space-y-6">
            {/* This component must render inputs with class="otp-digit input-hero" */}
            <OtpInput length={4} value={code} onChange={setCode} />

            <Button
              type="button"
              className="w-full btn-verify btn-shine btn-press"
              onClick={handleVerify}
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                type="button"
                onClick={handleResend}
                disabled={!isComplete || isResending}
                className="link-underline"
              >
                {isComplete ? "Resend Code" : `Resend code in ${formatted}`}
              </Button>
            </div>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}