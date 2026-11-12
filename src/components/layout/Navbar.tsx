"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RydvantaLogo } from "@/components/brand/RydvantaLogo";
import {
  Search,
  Ticket,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Menu,
  X,
  PhoneCall,
  HelpCircle,
  FileCheck,
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
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supportDropdownOpen, setSupportDropdownOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setSessionLoaded(false);
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (active) setSessionUser(data?.user ?? null);
      })
      .catch(() => {
        if (active) setSessionUser(null);
      })
      .finally(() => {
        if (active) setSessionLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSessionUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#F8F4EC]/95 backdrop-blur-md border-b border-[#E2DDD5] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <RydvantaLogo size="md" />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-charcoal">
          <Link
            href="/search"
            className={`transition-colors hover:text-terracotta ${
              pathname.startsWith("/search") || pathname.startsWith("/trips")
                ? "text-terracotta font-bold"
                : "text-charcoal"
            }`}
          >
            Search Trips
          </Link>

          <Link
            href="/passenger/bookings"
            className={`transition-colors hover:text-terracotta ${
              pathname.startsWith("/passenger")
                ? "text-terracotta font-bold"
                : "text-charcoal"
            }`}
          >
            My Bookings
          </Link>

          <Link
            href="/operator/dashboard"
            className={`transition-colors hover:text-terracotta ${
              pathname.startsWith("/operator")
                ? "text-terracotta font-bold"
                : "text-charcoal"
            }`}
          >
            Operator Portal
          </Link>

          {/* Support Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSupportDropdownOpen(!supportDropdownOpen)}
              onBlur={() => setTimeout(() => setSupportDropdownOpen(false), 200)}
              className="flex items-center gap-1 text-charcoal hover:text-terracotta transition-colors py-1"
            >
              <span>Support</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {supportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-charcoal-border shadow-warm-lg p-2 z-50 animate-in fade-in slide-in-from-top-1">
                <Link
                  href="/verify"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-charcoal hover:bg-ivory-soft rounded-lg transition-colors"
                >
                  <FileCheck className="w-4 h-4 text-forest" />
                  <span>Verify Ticket / PNR</span>
                </Link>
                <div className="px-3 py-2 text-xs text-charcoal-muted border-t border-charcoal-border/50 mt-1">
                  <div className="flex items-center gap-2 font-medium text-charcoal">
                    <PhoneCall className="w-3.5 h-3.5 text-terracotta" />
                    <span>24x7 Helpline</span>
                  </div>
                  <span className="font-mono text-[11px] block text-forest font-semibold mt-0.5">
                    1800-RYD-VANTA
                  </span>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right CTA / Session Area */}
        <div className="hidden md:flex items-center gap-3">
          {!sessionLoaded ? null : sessionUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-charcoal block">
                  {sessionUser.fullName}
                </span>
                <Badge variant="sage" className="text-[10px] uppercase font-mono px-2 py-0">
                  {sessionUser.role}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-charcoal/40 text-charcoal hover:border-charcoal hover:bg-ivory-soft font-semibold px-4 rounded-xl"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-terracotta hover:bg-terracotta-hover text-white font-semibold px-5 rounded-xl shadow-xs"
                >
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
          className="md:hidden p-2 rounded-xl text-charcoal hover:bg-ivory-soft transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-5 pt-3 pb-6 space-y-3 bg-[#F8F4EC] border-b border-[#E2DDD5] shadow-warm">
          <Link
            href="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-charcoal hover:text-terracotta"
          >
            Search Trips
          </Link>
          <Link
            href="/passenger/bookings"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-charcoal hover:text-terracotta"
          >
            My Bookings
          </Link>
          <Link
            href="/operator/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-charcoal hover:text-terracotta"
          >
            Operator Portal
          </Link>
          <Link
            href="/verify"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-charcoal hover:text-terracotta"
          >
            Verify Ticket / PNR
          </Link>

          <div className="pt-3 border-t border-charcoal-border flex items-center justify-between">
            {!sessionLoaded ? null : sessionUser ? (
              <div className="flex items-center justify-between w-full">
                <div>
                  <span className="text-xs font-bold block">{sessionUser.fullName}</span>
                  <span className="text-[10px] text-charcoal-muted uppercase">{sessionUser.role}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs text-red-600">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full pt-1">
                <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold rounded-xl">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full text-xs font-semibold bg-terracotta text-white rounded-xl">
                    Get Started
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
