"use client";

import React from "react";
import { Trip } from "@/types";
import { formatCurrency, formatTime, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bus, Clock, ShieldCheck, ArrowRight, MapPin, Wifi, Zap, Droplet } from "lucide-react";
import Link from "next/link";

interface TripCardProps {
  trip: Trip;
  onSelect?: (trip: Trip) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onSelect }) => {
  const depDate = new Date(trip.departure_time);
  const arrDate = new Date(trip.arrival_time);
  const durationMins = Math.round((arrDate.getTime() - depDate.getTime()) / (1000 * 60));

  const availableSeats = trip.available_seats_count ?? 24;
  const isLowAvailability = availableSeats > 0 && availableSeats <= 5;
  const isSoldOut = availableSeats === 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Column: Operator & Bus Type */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100">
              {trip.operator?.name || "Premium Transit Express"}
            </span>
            <Badge variant="secondary" className="text-[11px] font-normal uppercase tracking-wider">
              {trip.vehicle?.layout_type || "2x2 AC Seater"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Bus className="w-3.5 h-3.5 text-slate-400" />
            {trip.vehicle?.model || "Volvo Multi-Axle HD"} | Reg: {trip.vehicle?.registration_number || "MH-01-AB-1234"}
          </p>

          {/* Amenities Pills */}
          <div className="flex items-center gap-2 pt-1 text-slate-400">
            <span title="Free Wi-Fi" className="p-1 rounded bg-slate-50 dark:bg-slate-800">
              <Wifi className="w-3.5 h-3.5" />
            </span>
            <span title="Charging Ports" className="p-1 rounded bg-slate-50 dark:bg-slate-800">
              <Zap className="w-3.5 h-3.5" />
            </span>
            <span title="Free Mineral Water" className="p-1 rounded bg-slate-50 dark:bg-slate-800">
              <Droplet className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium ml-1">
              • Instant Confirmation
            </span>
          </div>
        </div>

        {/* Center Column: Departure, Duration & Arrival */}
        <div className="flex items-center gap-6">
          <div className="text-left">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {formatTime(trip.departure_time)}
            </span>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-500" />
              {trip.route?.origin_city || "Origin"}
            </p>
          </div>

          <div className="flex flex-col items-center px-2">
            <span className="text-[11px] text-slate-400 font-mono">
              {formatDuration(durationMins)}
            </span>
            <div className="flex items-center gap-1 my-1">
              <div className="w-2 h-2 rounded-full border border-blue-500" />
              <div className="w-16 h-[2px] bg-slate-200 dark:bg-slate-700" />
              <ArrowRight className="w-3 h-3 text-blue-500" />
            </div>
            <span className="text-[10px] text-slate-400">Direct Route</span>
          </div>

          <div className="text-left">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {formatTime(trip.arrival_time)}
            </span>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-500" />
              {trip.route?.destination_city || "Destination"}
            </p>
          </div>
        </div>

        {/* Right Column: Fare & Selection Action */}
        <div className="flex flex-col md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-400">Starting from</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(trip.base_fare)}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span
              className={`text-xs font-medium ${
                isSoldOut
                  ? "text-red-500"
                  : isLowAvailability
                  ? "text-amber-600 font-bold"
                  : "text-emerald-600"
              }`}
            >
              {isSoldOut ? "Sold Out" : `${availableSeats} seats left`}
            </span>

            <Link href={`/trips/${trip.id}`}>
              <Button
                variant={isSoldOut ? "secondary" : "default"}
                disabled={isSoldOut}
                className="font-semibold shadow-sm"
              >
                {isSoldOut ? "Full" : "Select Seats"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

