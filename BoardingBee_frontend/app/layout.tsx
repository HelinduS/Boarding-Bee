"use client";

import { Geist, Geist_Mono, Caveat } from "next/font/google";
import "./globals.css";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/ui/sidebar";
import Header from "@/components/ui/header";
import Link from "next/link";
import { CartProvider } from "@/context/cartContext"; 
import { AuthProvider } from "@/context/authContext";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const caveat = Caveat({
    variable: "--font-caveat",
    subsets: ["latin"],
});

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const pathname = usePathname();
        const isAdminDashboard = pathname.startsWith("/admindas");
        const isAuthPage = [
            "/login",
            "/register",
            "/forgot-password",
            "/reset-password",
            "/verify-code"
        ].some((route) => pathname.startsWith(route));

    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} antialiased`}>
                <CartProvider>
                  <AuthProvider>
                    {!isAdminDashboard && !isAuthPage && <Header />}
                    {isAuthPage && (
                        <div className="w-full bg-indigo-600 shadow-sm sticky top-0 z-30">
                            <div className="container mx-auto px-4 py-4 flex items-center">
                                <Link href="/" className="text-white hover:text-blue-200 flex items-center gap-2 text-lg font-medium">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                    Back
                                </Link>
                            </div>
                        </div>
                    )}
                    <div className="flex min-h-screen">
                        {isAdminDashboard && (
                            <div className="hidden md:flex md:w-64">
                                <Sidebar />
                            </div>
                        )}
                        <main className="flex-1 h-screen ">
                            {children}
                        </main>
                    </div>
                  </AuthProvider>
                </CartProvider>
            </body>
        </html>
    );
}
