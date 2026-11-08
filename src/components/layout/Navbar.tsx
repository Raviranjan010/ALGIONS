"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bus,
  Search,
  User,
  Shield,
  LayoutDashboard,
  LogOut,
  Ticket,
  Menu,
  X,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<{
    id: string;
    email: string;
    role: string;
    fullName: string;
  } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Read user session from cookie if available
    try {
      const match = document.cookie.match(new RegExp("(^| )algions_user_session=([^;]+)"));
      if (match) {
        const decoded = decodeURIComponent(match[2]);
        setSessionUser(JSON.parse(decoded));
      } else {
        setSessionUser(null);
      }
    } catch {
      setSessionUser(null);
    }
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSessionUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1">
              ALGIONS <span className="text-blue-600 text-sm font-bold">TRANSIT</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block -mt-1 font-semibold">
              Bus Booking Management
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/search"
            className={`flex items-center gap-1.5 transition-colors ${
              pathname.startsWith("/search") || pathname.startsWith("/trips")
                ? "text-blue-600 font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-blue-600"
            }`}
          >
            <Search className="w-4 h-4" /> Search Trips
          </Link>

          <Link
            href="/passenger/bookings"
            className={`flex items-center gap-1.5 transition-colors ${
              pathname.startsWith("/passenger")
                ? "text-blue-600 font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-blue-600"
            }`}
          >
            <Ticket className="w-4 h-4" /> My Bookings
          </Link>

          <Link
            href="/operator/dashboard"
            className={`flex items-center gap-1.5 transition-colors ${
              pathname.startsWith("/operator")
                ? "text-blue-600 font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-blue-600"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Operator Portal
          </Link>
        </nav>

        {/* Auth / Profile Area */}
        <div className="hidden md:flex items-center gap-3">
          {sessionUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  {sessionUser.fullName}
                </span>
                <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                  {sessionUser.role}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-semibold text-xs">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 space-y-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <Link
            href="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Search Trips
          </Link>
          <Link
            href="/passenger/bookings"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            My Bookings
          </Link>
          <Link
            href="/operator/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Operator Portal
          </Link>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {sessionUser ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold">{sessionUser.fullName} ({sessionUser.role})</span>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs text-red-600">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full text-xs font-semibold bg-blue-600 text-white">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

