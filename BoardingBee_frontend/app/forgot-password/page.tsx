'use client';
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { AuthCard } from "../../components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { emailSchema } from "../../lib/validators";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { authApi } from "../../lib/authApi";
type ForgotPasswordFormValues = z.infer<typeof emailSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const res = await authApi.requestReset(data.email);
      if (res.ok) {
        toast.success("Verification code sent");
        router.push(`/verify-code?email=${encodeURIComponent(data.email)}`);
      } else {
        toast.error("Failed to send reset link");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="bb-bg bb-grid bb-noise min-h-screen flex items-center justify-center px-4">
      {/* floating blobs */}
      <div className="bb-blob" />
      <div className="bb-blob2" />

      {/* gradient glow frame around the card */}
      <div className="bb-gradient-border bb-glow w-full max-w-md">
        <AuthCard
          title="Forgot Password"
          subtitle="Please enter your email address to receive a verification code."
          showBackButton
          backTo="/login"
          illustration={
            <div className="bg-primary/10 p-4 rounded-full">
              <Lock size={48} className="text-primary" />
            </div>
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm mb-1">E-mail</label>
              <Input
                className="input-hero"
                placeholder="your.email@example.com"
                {...register("email")}
              />
              {errors.email?.message && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full btn-send btn-shine btn-press"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Code"}
            </Button>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
