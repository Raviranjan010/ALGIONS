import React from "react";
import { SearchForm } from "@/components/search/SearchForm";
import { Armchair, ShieldCheck, Zap } from "lucide-react";

export const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-forest-dark overflow-hidden pt-12 sm:pt-16 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-8">
      {/* Background Scenic Highway Coach Image & Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-bg.jpg"
          alt="Rydvanta Luxury Coach on Mountain Scenic Highway"
          className="w-full h-full object-cover object-right sm:object-center opacity-85"
          onError={(e) => {
            // High-resolution fallback of scenic coach on highway
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=2000&q=80";
          }}
        />
        {/* Left Dark Forest Gradient Overlay so typography is 100% crisp & readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-forest-dark via-forest/90 to-transparent sm:w-3/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-transparent to-forest-dark/40" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        {/* Top Text Content */}
        <div className="max-w-2xl space-y-4">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-200/95 uppercase tracking-widest">
              Bus Booking Management System
            </span>
            <span className="w-10 h-[1.5px] bg-terracotta/80 inline-block" />
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
            Book Your Next <br />
            <span className="text-white">Journey with Rydvanta</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-ivory-soft/90 max-w-xl font-normal leading-relaxed">
            Reliable bus bookings, real-time availability, secure payments, and hassle-free travel management.
          </p>

          {/* 3 Trust Badges from Reference Mockup */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-deep/60 backdrop-blur-md border border-ivory-soft/20 text-white text-xs font-semibold">
              <Armchair className="w-3.5 h-3.5 text-terracotta" />
              <span>Live Seat Selection</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-deep/60 backdrop-blur-md border border-ivory-soft/20 text-white text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Secure Booking</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-deep/60 backdrop-blur-md border border-ivory-soft/20 text-white text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Confirmation</span>
            </div>
          </div>
        </div>

        {/* Floating Search Panel (Overlaps bottom of hero) */}
        <div className="pt-6 sm:pt-8 -mb-28 sm:-mb-36 relative z-20">
          <SearchForm />
        </div>
      </div>
    </section>
  );
};
