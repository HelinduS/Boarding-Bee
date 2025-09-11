'use client';
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  backTo?: string;
  illustration?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, showBackButton = false, backTo = "/login", illustration }: AuthCardProps) {
  return (
    <Card className="relative w-full max-w-md mx-auto">
      <CardHeader className="pb-2">
        {showBackButton && (
          <Link href={backTo} className="absolute left-4 top-4 text-foreground/70 hover:text-foreground">
            <ArrowLeft size={20} />
          </Link>
        )}
        <div className="flex flex-col items-center">
          {illustration && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }} className="mb-4">
              {illustration}
            </motion.div>
          )}
          <CardTitle className="text-2xl text-center">{title}</CardTitle>
          {subtitle && <CardDescription className="text-center mt-1">{subtitle}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}