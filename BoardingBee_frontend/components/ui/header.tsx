import Link from "next/link";

import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut, useSession } from "next-auth/react";

export default function Header() {
  const { isAuthenticated, isOwner, user, logout } = useAuth();
  const router = useRouter();

  return (
  <header className="w-full fixed top-0 left-0 z-30 bg-indigo-600 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between min-h-[72px]">
        {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-3 font-bold text-2xl md:text-3xl text-white">
          <img 
            src="/images/image.png" 
            alt="Boarding Bee Logo" 
            className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-white items-center" 
          />
          <span className="tracking-wide hover:text-yellow-300 transition-colors">Boarding Bee</span>
        </Link>

        {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-base font-medium">
            <Link href="/" className="text-white hover:text-indigo-100 transition-colors">Home</Link>

            {isAuthenticated && (user?.role?.toLowerCase?.() === "admin") && (
              <button
                onClick={() => router.push("/admin-dashboard")}
                className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg shadow hover:bg-indigo-200 transition-all"
              >
                Admin Dashboard
              </button>
            )}

            {isAuthenticated && isOwner && user?.role?.toLowerCase?.() !== "admin" && (
              <button
                onClick={() => router.push("/owner-dashboard")}
                className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg shadow hover:bg-indigo-200 transition-all"
              >
                Owner Dashboard
              </button>
            )}

            {isAuthenticated && (
              <button
                onClick={() => {
                  if (isOwner) router.push("/create-listing");
                  else router.push("/register-owner");
                }}
                className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg shadow hover:bg-indigo-200 transition-all"
              >
                Create Listing
              </button>
            )}

            {isAuthenticated ? (
              <button
                onClick={() => logout()}
                className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-400 transition-all"
              >
                Logout
              </button>
            ) : (
              <>
                <Link href="/login" className="text-white hover:text-indigo-100 transition-colors">Login</Link>
                <Link 
                  href="/register" 
                  className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg shadow hover:bg-indigo-200 transition-all"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
      </div>
    </header>
  );
}