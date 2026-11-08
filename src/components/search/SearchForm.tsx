"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeftRight, Calendar, MapPin, Search, Users } from "lucide-react";

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

  // Tomorrow as default date (YYYY-MM-DD)
  const defaultDate = React.useMemo(() => {
    if (initialDate) return initialDate;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }, [initialDate]);

  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [date, setDate] = useState(defaultDate);
  const [passengers, setPassengers] = useState(initialPassengers);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSubmit = (e: React.FormEvent) => {
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

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl transition-all ${
        compact ? "p-4" : "p-6 sm:p-8"
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Origin */}
        <div className="md:col-span-3 space-y-1.5">
          <Label htmlFor="origin" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            From City
          </Label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
            <Input
              id="origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Mumbai"
              required
              className="pl-9 h-11 text-base font-medium"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center pb-1">
          <button
            type="button"
            onClick={handleSwap}
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center justify-center shadow-sm"
            title="Swap Origin and Destination"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Destination */}
        <div className="md:col-span-3 space-y-1.5">
          <Label htmlFor="destination" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            To City
          </Label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
            <Input
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Pune"
              required
              className="pl-9 h-11 text-base font-medium"
            />
          </div>
        </div>

        {/* Travel Date */}
        <div className="md:col-span-3 space-y-1.5">
          <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Date of Journey
          </Label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="pl-9 h-11 text-base font-medium"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2">
          <Button
            type="submit"
            className="w-full h-11 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </Button>
        </div>
      </div>

      {/* Quick City Filter Pills */}
      {!compact && (
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 dark:text-slate-400">Popular Routes:</span>
          {[
            { from: "Mumbai", to: "Pune" },
            { from: "Bangalore", to: "Hyderabad" },
            { from: "Delhi", to: "Jaipur" },
            { from: "Chennai", to: "Bangalore" },
          ].map((rt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setOrigin(rt.from);
                setDestination(rt.to);
              }}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 transition-colors"
            >
              {rt.from} → {rt.to}
            </button>
          ))}
        </div>
      )}
    </form>
  );
};
