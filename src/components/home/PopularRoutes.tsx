"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Bus, ChevronLeft, ChevronRight } from "lucide-react";

export interface RouteItem {
  id: string;
  origin: string;
  destination: string;
  duration: string;
  busCount: string;
  image: string;
  fallbackImage: string;
  startingFare?: number;
}

const routes: RouteItem[] = [
  {
    id: "mumbai-pune",
    origin: "Mumbai",
    destination: "Pune",
    duration: "3h 45m",
    busCount: "50+ Buses",
    image: "/images/card-mumbai.jpg",
    fallbackImage: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80",
    startingFare: 350,
  },
  {
    id: "bangalore-hyderabad",
    origin: "Bangalore",
    destination: "Hyderabad",
    duration: "8h 30m",
    busCount: "30+ Buses",
    image: "/images/card-bangalore.jpg",
    fallbackImage: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80",
    startingFare: 850,
  },
  {
    id: "delhi-jaipur",
    origin: "Delhi",
    destination: "Jaipur",
    duration: "5h 15m",
    busCount: "40+ Buses",
    image: "/images/card-delhi.jpg",
    fallbackImage: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80",
    startingFare: 450,
  },
  {
    id: "chennai-bangalore",
    origin: "Chennai",
    destination: "Bangalore",
    duration: "6h 45m",
    busCount: "35+ Buses",
    image: "/images/card-chennai.jpg",
    fallbackImage: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80",
    startingFare: 600,
  },
];

export const PopularRoutes: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-charcoal">
          Popular Routes
        </h2>

        <div className="flex items-center gap-3">
          <Link
            href="/search?origin=Mumbai&destination=Pune"
            className="text-xs sm:text-sm font-bold text-terracotta hover:text-terracotta-hover flex items-center gap-1 group transition-colors"
          >
            <span>View All Routes</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Slider Controls matching mockup */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full border border-charcoal-border bg-white hover:bg-ivory-soft flex items-center justify-center text-charcoal transition-colors shadow-xs"
              aria-label="Previous routes"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full border border-terracotta bg-terracotta text-white hover:bg-terracotta-hover flex items-center justify-center transition-colors shadow-xs"
              aria-label="Next routes"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid / Horizontal Slider */}
      <div
        ref={scrollRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 overflow-x-auto pb-2 scrollbar-none"
      >
        {routes.map((rt) => {
          const searchUrl = `/search?origin=${encodeURIComponent(rt.origin)}&destination=${encodeURIComponent(rt.destination)}`;

          return (
            <Link
              key={rt.id}
              href={searchUrl}
              className="group block bg-white rounded-2xl border border-charcoal-border/70 overflow-hidden shadow-warm hover:shadow-warm-lg transition-all duration-200 hover:-translate-y-1"
            >
              {/* Image Container with Landmark Photo */}
              <div className="relative h-40 w-full overflow-hidden bg-ivory-dark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={rt.image}
                  alt={`${rt.origin} to ${rt.destination}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback if local image fails
                    (e.target as HTMLImageElement).src = rt.fallbackImage;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent" />
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-charcoal group-hover:text-terracotta transition-colors">
                    {rt.origin} → {rt.destination}
                  </h3>

                  {/* Circular Orange Arrow Button from mockup */}
                  <div className="w-8 h-8 rounded-full bg-ivory-soft group-hover:bg-terracotta text-charcoal group-hover:text-white flex items-center justify-center transition-colors shadow-xs shrink-0">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-charcoal-muted font-medium pt-1 border-t border-charcoal-border/40">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-charcoal-muted" />
                    <span>{rt.duration}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5 text-charcoal-muted" />
                    <span>{rt.busCount}</span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
