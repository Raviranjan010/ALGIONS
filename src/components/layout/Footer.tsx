import React from "react";
import Link from "next/link";
import { RydvantaLogo } from "@/components/brand/RydvantaLogo";
import { ShieldCheck, PhoneCall, CheckCircle2, ArrowUpRight } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-forest-dark text-ivory-soft/80 text-sm border-t border-forest-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <RydvantaLogo variant="light" size="lg" showTagline={true} />
            <p className="text-xs text-ivory-soft/70 leading-relaxed pt-1">
              Premium Bus Booking & Transit Management Platform. Engineered with PostgreSQL row-level locks, zero double-booking concurrency guarantees, and real-time operator manifests.
            </p>
            <div className="flex items-center gap-2 text-xs text-ivory-soft/90 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Popular Routes
            </h4>
            <ul className="space-y-2.5 text-xs text-ivory-soft/80">
              <li>
                <Link
                  href="/search?origin=Mumbai&destination=Pune"
                  className="hover:text-terracotta transition-colors flex items-center justify-between group"
                >
                  <span>Mumbai → Pune</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  href="/search?origin=Bangalore&destination=Hyderabad"
                  className="hover:text-terracotta transition-colors flex items-center justify-between group"
                >
                  <span>Bangalore → Hyderabad</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  href="/search?origin=Delhi&destination=Jaipur"
                  className="hover:text-terracotta transition-colors flex items-center justify-between group"
                >
                  <span>Delhi → Jaipur</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  href="/search?origin=Chennai&destination=Bangalore"
                  className="hover:text-terracotta transition-colors flex items-center justify-between group"
                >
                  <span>Chennai → Bangalore</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* System Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Transit Portals
            </h4>
            <ul className="space-y-2.5 text-xs text-ivory-soft/80">
              <li>
                <Link href="/passenger/bookings" className="hover:text-terracotta transition-colors">
                  Passenger Bookings & Tickets
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-terracotta transition-colors">
                  Verify Boarding Pass (QR)
                </Link>
              </li>
              <li>
                <Link href="/operator/dashboard" className="hover:text-terracotta transition-colors">
                  Operator Management Portal
                </Link>
              </li>
              <li>
                <Link href="/operator/manifests" className="hover:text-terracotta transition-colors">
                  Passenger Manifest Dispatch
                </Link>
              </li>
              <li>
                <Link href="/operator/reports" className="hover:text-terracotta transition-colors">
                  Financial & Occupancy Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Guarantee */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Reliability Guarantee
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Strict Concurrency</span>
                  <span className="text-[11px] text-ivory-soft/60">
                    PostgreSQL row-level locking eliminates any risk of seat collisions.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Simulated Instant Refunds</span>
                  <span className="text-[11px] text-ivory-soft/60">
                    Automatic tiered refund calculations on passenger cancellations.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <PhoneCall className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">24x7 Transit Helpline</span>
                  <span className="text-[11px] font-mono text-ivory-soft/90">
                    1800-RYD-VANTA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Legal */}
        <div className="mt-12 pt-8 border-t border-forest-surface flex flex-col sm:flex-row items-center justify-between text-xs text-ivory-soft/60 gap-4">
          <p>© {new Date().getFullYear()} Rydvanta Transit Technologies. Every route. Reliably booked.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Cancellation Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
