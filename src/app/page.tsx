import React from "react";
import { SearchForm } from "@/components/search/SearchForm";
import { TripCard } from "@/components/search/TripCard";
import { TripService } from "@/services/trip-service";
import { ShieldCheck, Bus, Zap, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const featuredTrips = await TripService.getAllTrips();

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 text-white pt-16 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ALGIONS Full-Stack Assessment • Production System
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Next-Generation Intercity <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-sky-300 to-white">
              Bus Booking Management
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-blue-100 font-normal leading-relaxed">
            Engineered with strict PostgreSQL row-level locks, zero double-booking concurrency guarantees, real-time operator manifests, and policy-backed simulated refunds.
          </p>

          {/* Search Card Container */}
          <div className="pt-8 max-w-4xl mx-auto text-left text-slate-900">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Featured Scheduled Departures */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 -mt-12 relative z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Live Available Departures
            </h2>
            <p className="text-xs text-slate-500">
              Real database-backed schedules ready for interactive seat booking and live manifest verification.
            </p>
          </div>
          <Link href="/search?origin=Mumbai&destination=Pune">
            <Button variant="outline" size="sm" className="font-semibold text-xs gap-1.5">
              View All Routes <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {featuredTrips.slice(0, 3).map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </section>

      {/* System Highlights / Acceptance Scenario Capabilities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            Engineered for High-Concurreny Transit Operations
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Every critical acceptance scenario is built into the core transactional engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Zero Double-Booking Lock
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Implemented using PostgreSQL transactional RPCs with <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">FOR UPDATE</code> row-level seat locking and a partial unique constraint preventing duplicate active allocations.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Deterministic Idempotency
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every booking request supports client-provided or auto-generated idempotency keys. Network retries return the exact original PNR without duplicate charges.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Live Manifest Reconciliation
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Dispatchers and operators receive synchronized passenger manifests and occupancy analytics that reconcile to the rupee against confirmed and cancelled tickets.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

