import Link from "next/link";

import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const { isAuthenticated, isOwner, user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="w-full sticky top-0 z-30 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-500 shadow-md">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between min-h-[80px]">
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
        <nav className="hidden md:flex items-center gap-8 text-lg font-medium">
          <Link href="/" className="relative text-white hover:text-yellow-300 transition-colors">
            Home
            <span className="absolute left-0 bottom-[-4px] w-0 h-[2px] bg-yellow-300 transition-all group-hover:w-full"></span>
          </Link>
          {isAuthenticated && isOwner && (
          <button
            onClick={() => router.push("/owner-dashboard")}
            className="bg-blue-100 text-indigo-900 px-3 py-1.5 rounded-lg shadow hover:bg-blue-200 transition-all text-base"
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
            className="bg-indigo-100 text-indigo-900 px-3 py-1.5 rounded-lg shadow hover:bg-indigo-200 transition-all text-base"
          >
            Create Listing
          </button>
        )}

        {!isAuthenticated ? (
          <>
            <Link href="/login" className="text-white hover:text-blue-200 transition-colors">Login</Link>
            <Link 
              href="/register" 
              className="bg-blue-100 text-indigo-900 px-4 py-2 rounded-lg shadow hover:bg-blue-200 transition-all"
            >
              Register
            </Link>
          </>
        ) : (
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-400 transition-all"
          >
            Logout
          </button>
        )}
          
        </nav>
      </div>
    </header>
  );
}