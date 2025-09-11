'use client';
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/PasswordField";
import { passwordSchema } from "@/lib/validators";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { authApi } from "@/lib/authApi";

type ResetPasswordFormValues = z.infer<typeof passwordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const email = decodeURIComponent(params.get("email") ?? "");
  const token = params.get("token") ?? "";

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const watchPassword = watch("newPassword", "");
  const hasMinLength = watchPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(watchPassword);
  const hasNumber = /\d/.test(watchPassword);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      const res = await authApi.resetPassword(email, token, data.newPassword);
      if (res.ok) {
        toast.success("Password updated successfully");
        router.push("/login");
      } else {
        toast.error("Failed to reset password");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bb-bg bb-grid bb-noise flex items-center justify-center px-4 py-16">
      {/* floating blobs */}
      <div className="bb-blob" />
      <div className="bb-blob2" />

      {/* gradient glow frame around the card */}
      <div className="bb-gradient-border bb-glow w-full max-w-md">
        <AuthCard
          title="Create New Password"
          subtitle="Your new password must be different from previously used passwords."
          showBackButton
          backTo="/verify-code"
          illustration={
            <div className="bg-primary/10 p-4 rounded-full">
              <ShieldCheck size={48} className="text-primary" />
            </div>
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <PasswordField
              label="New Password"
              placeholder="••••••••••••"
              className="input-hero"
              {...register("newPassword")}
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">Password requirements:</p>
              <ul className="space-y-1">
                <li className="flex items-center text-sm">
                  {hasMinLength ? (
                    <CheckCircle2 size={16} className="text-green-500 mr-2" />
                  ) : (
                    <XCircle size={16} className="text-gray-400 mr-2" />
                  )}
                  At least 8 characters
                </li>
                <li className="flex items-center text-sm">
                  {hasUppercase ? (
                    <CheckCircle2 size={16} className="text-green-500 mr-2" />
                  ) : (
                    <XCircle size={16} className="text-gray-400 mr-2" />
                  )}
                  At least 1 uppercase letter
                </li>
                <li className="flex items-center text-sm">
                  {hasNumber ? (
                    <CheckCircle2 size={16} className="text-green-500 mr-2" />
                  ) : (
                    <XCircle size={16} className="text-gray-400 mr-2" />
                  )}
                  At least 1 number
                </li>
              </ul>
            </div>

            <PasswordField
              label="Confirm Password"
              placeholder="••••••••••••"
              className="input-hero"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword?.message && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}

            <Button type="submit" className="w-full btn-shine btn-press" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
