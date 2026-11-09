"use client";

import React, { useState } from "react";
import { TripSeat } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { Armchair, Bed, Check, ShieldCheck, Compass } from "lucide-react";

interface SeatMapProps {
  seats: TripSeat[];
  selectedSeatIds: string[];
  onSeatToggle: (seat: TripSeat) => void;
  maxSeats?: number;
  layoutType?: string;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeatIds,
  onSeatToggle,
  maxSeats = 6,
  layoutType = "2x2",
}) => {
  const [activeDeck, setActiveDeck] = useState<"lower" | "upper">("lower");

  // Filter seats by active deck if multiple decks exist
  const hasMultipleDecks = seats.some((s) => s.deck === "upper");
  const displaySeats = hasMultipleDecks
    ? seats.filter((s) => (s.deck || "lower") === activeDeck)
    : seats;

  // Group seats by row
  const rowsMap = new Map<number, TripSeat[]>();
  displaySeats.forEach((seat) => {
    const row = seat.seat_row || 1;
    if (!rowsMap.has(row)) {
      rowsMap.set(row, []);
    }
    rowsMap.get(row)!.push(seat);
  });

  const sortedRowKeys = Array.from(rowsMap.keys()).sort((a, b) => a - b);

  return (
    <div className="bg-white border border-charcoal-border/80 rounded-3xl p-5 sm:p-7 shadow-warm space-y-6">
      {/* Header & Deck Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-charcoal-border/60 gap-3">
        <div>
          <h3 className="text-base font-extrabold text-charcoal flex items-center gap-2">
            <Armchair className="w-5 h-5 text-terracotta" />
            Interactive Seat Selection
          </h3>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Select up to {maxSeats} seats. Real-time availability protected by PostgreSQL row-level locks.
          </p>
        </div>

        {hasMultipleDecks && (
          <div className="flex bg-ivory-soft p-1 rounded-xl self-start sm:self-auto border border-charcoal-border/60">
            <button
              type="button"
              onClick={() => setActiveDeck("lower")}
              className={cn(
                "px-3.5 py-1 text-xs font-bold rounded-lg transition-all",
                activeDeck === "lower"
                  ? "bg-forest text-white shadow-xs"
                  : "text-charcoal hover:text-forest"
              )}
            >
              Lower Deck
            </button>
            <button
              type="button"
              onClick={() => setActiveDeck("upper")}
              className={cn(
                "px-3.5 py-1 text-xs font-bold rounded-lg transition-all",
                activeDeck === "upper"
                  ? "bg-forest text-white shadow-xs"
                  : "text-charcoal hover:text-forest"
              )}
            >
              Upper Deck
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 py-2.5 px-4 bg-ivory-soft/80 rounded-2xl border border-charcoal-border/60 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg border-2 border-charcoal-border bg-white" />
          <span className="text-charcoal font-medium">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-terracotta text-white flex items-center justify-center shadow-xs">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-charcoal font-bold">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-charcoal-border/60 text-charcoal-muted opacity-60" />
          <span className="text-charcoal-muted font-medium">Booked</span>
        </div>
      </div>

      {/* Bus Blueprint Layout */}
      <div className="max-w-md mx-auto bg-ivory-light rounded-3xl p-6 border-2 border-charcoal-border/80 shadow-warm">
        {/* Driver Cabin Indicator */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-dashed border-charcoal-border/70">
          <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-muted">
            Front of Bus
          </span>
          <div className="w-9 h-9 rounded-full border-2 border-charcoal-border bg-white flex items-center justify-center text-forest shadow-xs">
            <Compass className="w-5 h-5 animate-spin-slow text-terracotta" />
          </div>
        </div>

        {/* Rows Container */}
        <div className="space-y-3.5">
          {sortedRowKeys.map((rowKey) => {
            const rowSeats = rowsMap.get(rowKey) || [];
            rowSeats.sort((a, b) => (a.seat_column || 1) - (b.seat_column || 1));

            // Split into Left and Right aisle columns
            const is2x1 = layoutType.includes("2x1") || rowSeats.length <= 3;
            const leftColSeats = is2x1 ? rowSeats.slice(0, 1) : rowSeats.slice(0, 2);
            const rightColSeats = is2x1 ? rowSeats.slice(1) : rowSeats.slice(2);

            return (
              <div key={rowKey} className="flex items-center justify-between">
                {/* Left Column Seats */}
                <div className="flex items-center gap-2.5">
                  {leftColSeats.map((seat) => renderSeatButton(seat))}
                </div>

                {/* Aisle Space */}
                <div className="w-7 text-center text-[10px] text-charcoal-muted/40 font-mono select-none">
                  •••
                </div>

                {/* Right Column Seats */}
                <div className="flex items-center gap-2.5">
                  {rightColSeats.map((seat) => renderSeatButton(seat))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rear Indicator */}
        <div className="pt-6 mt-6 border-t-2 border-dashed border-charcoal-border/70 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-muted">
            Rear of Bus
          </span>
        </div>
      </div>
    </div>
  );

  function renderSeatButton(seat: TripSeat) {
    const isBooked = seat.status === "booked" || seat.status === "blocked";
    const isSelected = selectedSeatIds.includes(seat.id);
    const isSleeper = seat.seat_type === "sleeper";

    return (
      <button
        key={seat.id}
        type="button"
        disabled={isBooked}
        onClick={() => onSeatToggle(seat)}
        className={cn(
          "relative flex flex-col items-center justify-center transition-all duration-150 rounded-xl font-mono",
          isSleeper ? "w-14 h-10 text-xs" : "w-10 h-10 text-xs",
          isBooked
            ? "bg-charcoal-border/40 text-charcoal-muted/50 cursor-not-allowed border border-charcoal-border/40 opacity-50"
            : isSelected
            ? "bg-terracotta text-white shadow-md scale-105 border-2 border-terracotta-hover ring-2 ring-terracotta/30"
            : "bg-white hover:bg-ivory-soft text-charcoal border-2 border-charcoal-border hover:border-forest shadow-xs hover:scale-105"
        )}
        title={`Seat ${seat.seat_number} - ${formatCurrency(seat.fare)} (${seat.status})`}
      >
        {isSleeper ? (
          <Bed className="w-3.5 h-3.5 mb-0.5 opacity-80" />
        ) : (
          <Armchair className="w-3.5 h-3.5 mb-0.5 opacity-80" />
        )}
        <span className="font-bold text-[11px] leading-none">{seat.seat_number}</span>
      </button>
    );
  }
};
