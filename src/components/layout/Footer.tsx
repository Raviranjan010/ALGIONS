import React from "react";
import Link from "next/link";
import { Bus, ShieldCheck, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Bus className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-lg">ALGIONS TRANSIT</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full-Stack Bus Booking Management System developed for the ALGIONS AI LABS Assessment. Built with Next.js, Supabase PostgreSQL, and atomic locking.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Explore Routes
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/search?origin=Mumbai&destination=Pune" className="hover:text-white transition-colors">
                  Mumbai to Pune
                </Link>
              </li>
              <li>
                <Link href="/search?origin=Bangalore&destination=Hyderabad" className="hover:text-white transition-colors">
                  Bangalore to Hyderabad
                </Link>
              </li>
              <li>
                <Link href="/search?origin=Delhi&destination=Jaipur" className="hover:text-white transition-colors">
                  Delhi to Jaipur
                </Link>
              </li>
            </ul>
          </div>

          {/* System Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/passenger/bookings" className="hover:text-white transition-colors">
                  Passenger Booking History
                </Link>
              </li>
              <li>
                <Link href="/operator/dashboard" className="hover:text-white transition-colors">
                  Operator Management Portal
                </Link>
              </li>
              <li>
                <Link href="/operator/manifests" className="hover:text-white transition-colors">
                  Passenger Manifests
                </Link>
              </li>
              <li>
                <Link href="/operator/reports" className="hover:text-white transition-colors">
                  Occupancy & Financial Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & System Status */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              System Guarantees
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Zero Double-Booking Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Atomic PostgreSQL RPC transactions with FOR UPDATE row locks prevent race conditions.
              </p>
              <div className="pt-2 text-[11px] text-slate-500">
                Simulated Policy-Driven Instant Refunds
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} ALGIONS AI LABS Assessment. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with strict TypeScript, Next.js 15, and Supabase PostgreSQL.
          </p>
        </div>
      </div>
    </footer>
  );
};
