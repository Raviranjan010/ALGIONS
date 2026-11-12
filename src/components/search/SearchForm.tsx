"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Search,
  ArrowLeftRight,
  Bus,
  Ticket,
  ChevronDown,
} from "lucide-react";

interface SearchFormProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialDate?: string;
  initialPassengers?: number;
  compact?: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  initialOrigin = "Mumbai",
  initialDestination = "Pune",
  initialDate,
  initialPassengers = 1,
  compact = false,
}) => {
  const router = useRouter();

  // Active tab: 'book' or 'manage'
  const [activeTab, setActiveTab] = useState<"book" | "manage">("book");

  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  // Keep the initial server and browser render identical; calculate the
  // timezone-dependent default only after hydration.
  const [date, setDate] = useState(initialDate || "");
  const [passengers, setPassengers] = useState(initialPassengers);
  const [pnrSearch, setPnrSearch] = useState("");

  React.useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
      return;
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  }, [initialDate]);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;

    const query = new URLSearchParams({
      origin: origin.trim(),
      destination: destination.trim(),
      date,
      passengers: passengers.toString(),
    });

    router.push(`/search?${query.toString()}`);
  };

  const handleManageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnrSearch.trim()) return;
    router.push(`/passenger/bookings?pnr=${encodeURIComponent(pnrSearch.trim().toUpperCase())}`);
  };

  if (compact) {
    return (
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white rounded-2xl border border-charcoal-border p-4 shadow-warm"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Origin */}
          <div className="md:col-span-3 relative">
            <div className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider mb-1 ml-1">
              From
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-terracotta absolute left-3 top-3 pointer-events-none" />
              <Input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Origin City"
                className="pl-9 h-10 font-semibold text-charcoal"
                required
              />
            </div>
          </div>

          {/* Swap */}
          <div className="md:col-span-1 flex justify-center pt-4 md:pt-4">
            <button
              type="button"
              onClick={handleSwap}
              className="w-9 h-9 rounded-full bg-ivory-soft hover:bg-ivory border border-charcoal-border flex items-center justify-center text-charcoal hover:text-terracotta transition-colors"
              title="Swap Cities"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Destination */}
          <div className="md:col-span-3 relative">
            <div className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider mb-1 ml-1">
              To
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-forest absolute left-3 top-3 pointer-events-none" />
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination City"
                className="pl-9 h-10 font-semibold text-charcoal"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div className="md:col-span-3 relative">
            <div className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider mb-1 ml-1">
              Date of Journey
            </div>
            <div className="relative">
              <CalendarIcon className="w-4 h-4 text-charcoal-muted absolute left-3 top-3 pointer-events-none" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9 h-10 font-semibold text-charcoal"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 pt-4 md:pt-4">
            <Button
              type="submit"
              className="w-full h-10 bg-terracotta hover:bg-terracotta-hover text-white font-bold gap-2 shadow-xs"
            >
              <Search className="w-4 h-4" /> Search
            </Button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Top Segmented Tabs matching reference image */}
      <div className="inline-flex rounded-t-2xl bg-white/95 backdrop-blur-sm border-t border-x border-charcoal-border/70 p-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("book")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === "book"
              ? "text-charcoal bg-white shadow-xs"
              : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          <Bus className={`w-4 h-4 ${activeTab === "book" ? "text-terracotta" : "text-charcoal-muted"}`} />
          <span>Book a Bus</span>
          {activeTab === "book" && (
            <span className="absolute bottom-0 left-6 right-6 h-0.5 bg-terracotta rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("manage")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === "manage"
              ? "text-charcoal bg-white shadow-xs"
              : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          <Ticket className={`w-4 h-4 ${activeTab === "manage" ? "text-terracotta" : "text-charcoal-muted"}`} />
          <span>Manage Booking</span>
          {activeTab === "manage" && (
            <span className="absolute bottom-0 left-6 right-6 h-0.5 bg-terracotta rounded-full" />
          )}
        </button>
      </div>

      {/* Main Search Container */}
      <div className="bg-white rounded-b-3xl rounded-tr-3xl border border-charcoal-border/80 p-5 sm:p-7 shadow-warm-lg">
        {activeTab === "book" ? (
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Origin City */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-charcoal-muted uppercase tracking-wider mb-1.5 ml-1">
                  From
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-terracotta absolute left-3.5 top-3.5 pointer-events-none" />
                  <Input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="pl-10 h-12 text-sm font-bold text-charcoal border-charcoal-border rounded-xl focus:border-terracotta"
                    required
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="md:col-span-1 flex justify-center pt-1 md:pt-5">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-10 h-10 rounded-full bg-ivory-soft hover:bg-ivory border border-charcoal-border flex items-center justify-center text-charcoal hover:text-terracotta transition-transform hover:rotate-180 duration-200 shadow-xs"
                  title="Swap Origin and Destination"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>

              {/* Destination City */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-charcoal-muted uppercase tracking-wider mb-1.5 ml-1">
                  To
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-forest absolute left-3.5 top-3.5 pointer-events-none" />
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Pune"
                    className="pl-10 h-12 text-sm font-bold text-charcoal border-charcoal-border rounded-xl focus:border-terracotta"
                    required
                  />
                </div>
              </div>

              {/* Date of Journey */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-charcoal-muted uppercase tracking-wider mb-1.5 ml-1">
                  Date of Journey
                </label>
                <div className="relative">
                  <CalendarIcon className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-3.5 pointer-events-none" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10 h-12 text-sm font-bold text-charcoal border-charcoal-border rounded-xl focus:border-terracotta"
                    required
                  />
                </div>
              </div>

              {/* Passengers Dropdown & Submit Button */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-charcoal-muted uppercase tracking-wider mb-1.5 ml-1">
                  Passengers
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-3.5 pointer-events-none" />
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-full h-12 pl-10 pr-8 text-sm font-bold text-charcoal bg-white border border-charcoal-border rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta appearance-none cursor-pointer"
                  >
                    <option value={1}>1 Passenger</option>
                    <option value={2}>2 Passengers</option>
                    <option value={3}>3 Passengers</option>
                    <option value={4}>4 Passengers</option>
                    <option value={5}>5 Passengers</option>
                    <option value={6}>6 Passengers</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-charcoal-muted absolute right-3 top-4 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Bottom Row: CTA Button matching mockup */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-charcoal-border/50">
              <div className="flex flex-wrap items-center gap-2 text-xs text-charcoal-muted">
                <span className="font-semibold text-charcoal">Popular:</span>
                {[
                  { from: "Mumbai", to: "Pune" },
                  { from: "Bangalore", to: "Hyderabad" },
                  { from: "Delhi", to: "Jaipur" },
                  { from: "Chennai", to: "Bangalore" },
                ].map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setOrigin(r.from);
                      setDestination(r.to);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-ivory-soft hover:bg-ivory border border-charcoal-border/60 hover:text-terracotta transition-colors text-[11px] font-medium"
                  >
                    {r.from} → {r.to}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                className="w-full sm:w-auto h-12 px-8 bg-terracotta hover:bg-terracotta-hover text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <Search className="w-4 h-4" />
                <span>Search Buses</span>
              </Button>
            </div>
          </form>
        ) : (
          /* Manage Booking Tab */
          <form onSubmit={handleManageSubmit} className="space-y-4 py-2">
            <div className="max-w-xl">
              <label className="block text-xs font-bold text-charcoal mb-1.5">
                Look up Booking by PNR Number
              </label>
              <p className="text-xs text-charcoal-muted mb-3">
                Enter your 10-character booking reference (e.g. ALG-XXXXXX) to view digital boarding passes, check seat allocation, or cancel.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={pnrSearch}
                  onChange={(e) => setPnrSearch(e.target.value.toUpperCase())}
                  placeholder="e.g. ALG-ABC123"
                  className="h-12 font-mono uppercase tracking-wider font-bold text-sm"
                  required
                />
                <Button
                  type="submit"
                  className="h-12 px-6 bg-terracotta hover:bg-terracotta-hover text-white font-bold text-xs shrink-0 rounded-xl"
                >
                  Retrieve Ticket
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
