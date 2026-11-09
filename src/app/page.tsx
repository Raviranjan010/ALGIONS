import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustBenefits } from "@/components/home/TrustBenefits";
import { PopularRoutes } from "@/components/home/PopularRoutes";
import { TripCard } from "@/components/search/TripCard";
import { TripService } from "@/services/trip-service";
import { ShieldCheck, Zap, ArrowRight, CheckCircle2, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const featuredTrips = await TripService.getAllTrips();

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* 1. Hero Section with Luxury Highway Coach and Floating Search Panel */}
      <HeroSection />

      {/* Spacer to accommodate floating search panel offset on mobile / desktop */}
      <div className="pt-20 sm:pt-24" />

      {/* 2. Trust & Benefits Bar matching mockup */}
      <TrustBenefits />

      {/* 3. Popular Routes Cards matching mockup */}
      <PopularRoutes />

      {/* 4. Live Scheduled Departures from Database */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-forest">
                Real-Time Database Availability
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal">
              Live Scheduled Departures
            </h2>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Available for immediate interactive seat selection, atomic locking, and verified digital boarding passes.
            </p>
          </div>

          <Link href="/search?origin=Mumbai&destination=Pune">
            <Button variant="outline" size="sm" className="font-bold text-xs gap-1.5 rounded-xl">
              <span>View All Routes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {featuredTrips.slice(0, 4).map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </section>

      {/* 5. Engineered for Concurrency & High Reliability Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-forest-deep rounded-3xl p-8 sm:p-12 text-white shadow-warm-lg space-y-8 relative overflow-hidden">
          {/* Subtle warm background accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-forest-surface/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-terracotta/10 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-2xl relative z-10 space-y-2">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest">
              Zero Double-Booking Guarantee
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Engineered for High-Concurrency Transit Operations
            </h3>
            <p className="text-xs sm:text-sm text-ivory-soft/80 leading-relaxed">
              Every seat allocation and cancellation is protected by atomic PostgreSQL transactions, row-level locks, and automated audit trails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Guarantee 1 */}
            <div className="bg-forest/60 border border-ivory-soft/15 p-6 rounded-2xl backdrop-blur-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-terracotta/20 text-terracotta flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">
                PostgreSQL Row Locking
              </h4>
              <p className="text-xs text-ivory-soft/75 leading-relaxed">
                Transactions lock target seat records with <code className="bg-forest-dark px-1.5 py-0.5 rounded text-amber-200 font-mono text-[11px]">FOR UPDATE</code>, eliminating race conditions during simultaneous booking attempts.
              </p>
            </div>

            {/* Guarantee 2 */}
            <div className="bg-forest/60 border border-ivory-soft/15 p-6 rounded-2xl backdrop-blur-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">
                Deterministic Idempotency
              </h4>
              <p className="text-xs text-ivory-soft/75 leading-relaxed">
                Client idempotency keys ensure retried network requests return the original confirmed booking without charging multiple times.
              </p>
            </div>

            {/* Guarantee 3 */}
            <div className="bg-forest/60 border border-ivory-soft/15 p-6 rounded-2xl backdrop-blur-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">
                Verifiable QR Boarding Passes
              </h4>
              <p className="text-xs text-ivory-soft/75 leading-relaxed">
                Boarding passes feature cryptographically generated PNRs with instant QR verification for transit operators, preserving passenger privacy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
