"use client";

import { Geist, Geist_Mono, Caveat } from "next/font/google";
import "./globals.css";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/ui/sidebar";
import { CartProvider } from "@/context/cartContext"; 

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

    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} antialiased`}>
                <CartProvider> {}
                    <div className="flex min-h-screen">
                        {isAdminDashboard && (
                            <div className="hidden md:flex md:w-64">
                                <Sidebar />
                            </div>
                        )}
                        <main className="flex-1 h-screen p-6">
                            {children}
                        </main>
                    </div>
                </CartProvider>
            </body>
        </html>
    );
}
