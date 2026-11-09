"use client";

import React from "react";
import { Trip } from "@/types";
import { formatCurrency, formatTime, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bus, Clock, ArrowRight, MapPin, Wifi, Zap, Droplet, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface TripCardProps {
  trip: Trip;
  onSelect?: (trip: Trip) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip }) => {
  const depDate = new Date(trip.departure_time);
  const arrDate = new Date(trip.arrival_time);
  const durationMins = Math.round((arrDate.getTime() - depDate.getTime()) / (1000 * 60));

  const availableSeats = trip.available_seats_count ?? 24;
  const isLowAvailability = availableSeats > 0 && availableSeats <= 5;
  const isSoldOut = availableSeats === 0;

  return (
    <div className="bg-white border border-charcoal-border/80 rounded-2xl p-5 sm:p-6 shadow-warm hover:shadow-warm-lg transition-all duration-150 hover:border-terracotta/40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Column: Operator & Bus Type */}
        <div className="space-y-2 md:max-w-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base sm:text-lg text-charcoal">
              {trip.operator?.name || "Rydvanta Prime Express"}
            </span>
            <Badge variant="sage" className="text-[10px] font-mono uppercase tracking-wider">
              {trip.vehicle?.layout_type || "2x2 AC Seater"}
            </Badge>
          </div>

          <p className="text-xs text-charcoal-muted flex items-center gap-1.5 font-medium">
            <Bus className="w-3.5 h-3.5 text-forest" />
            {trip.vehicle?.model || "Volvo Multi-Axle HD"} • Reg: {trip.vehicle?.registration_number || "MH-01-AB-1234"}
          </p>

          {/* Amenities Pills */}
          <div className="flex items-center gap-2 pt-1 text-charcoal-muted">
            <span title="High-Speed Wi-Fi" className="p-1.5 rounded-lg bg-ivory-soft hover:text-terracotta transition-colors">
              <Wifi className="w-3.5 h-3.5" />
            </span>
            <span title="In-Seat USB Charging" className="p-1.5 rounded-lg bg-ivory-soft hover:text-terracotta transition-colors">
              <Zap className="w-3.5 h-3.5" />
            </span>
            <span title="Complimentary Water" className="p-1.5 rounded-lg bg-ivory-soft hover:text-terracotta transition-colors">
              <Droplet className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] text-forest font-semibold ml-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified Transit
            </span>
          </div>
        </div>

        {/* Center Column: Departure, Duration & Arrival */}
        <div className="flex items-center gap-5 sm:gap-8 justify-between sm:justify-start">
          <div className="text-left">
            <span className="text-xl sm:text-2xl font-black text-charcoal block">
              {formatTime(trip.departure_time)}
            </span>
            <p className="text-xs font-bold text-forest flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-terracotta shrink-0" />
              <span>{trip.route?.origin_city || "Origin"}</span>
            </p>
          </div>

          <div className="flex flex-col items-center px-1">
            <span className="text-[11px] text-charcoal-muted font-bold tracking-tight">
              {formatDuration(durationMins)}
            </span>
            <div className="flex items-center gap-1 my-1">
              <div className="w-2 h-2 rounded-full border-2 border-terracotta bg-white" />
              <div className="w-14 sm:w-20 h-[2px] bg-charcoal-border" />
              <ArrowRight className="w-3.5 h-3.5 text-terracotta" />
            </div>
            <span className="text-[10px] text-charcoal-muted font-medium">Direct Express</span>
          </div>

          <div className="text-left">
            <span className="text-xl sm:text-2xl font-black text-charcoal block">
              {formatTime(trip.arrival_time)}
            </span>
            <p className="text-xs font-bold text-forest flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-forest shrink-0" />
              <span>{trip.route?.destination_city || "Destination"}</span>
            </p>
          </div>
        </div>

        {/* Right Column: Fare & Action */}
        <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-charcoal-border/40 gap-3">
          <div className="text-left md:text-right">
            <span className="text-[11px] text-charcoal-muted font-medium block">Starting from</span>
            <div className="text-2xl font-black text-charcoal">
              {formatCurrency(trip.base_fare)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold ${
                isSoldOut
                  ? "text-red-500"
                  : isLowAvailability
                  ? "text-terracotta"
                  : "text-forest"
              }`}
            >
              {isSoldOut ? "Sold Out" : `${availableSeats} seats left`}
            </span>

            <Link href={`/trips/${trip.id}`}>
              <Button
                variant={isSoldOut ? "secondary" : "default"}
                disabled={isSoldOut}
                className="font-bold text-xs h-10 px-5 rounded-xl shadow-xs"
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
