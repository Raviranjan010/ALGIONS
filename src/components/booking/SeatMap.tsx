"use client";

import React, { useState } from "react";
import { TripSeat } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { ShieldCheck, Armchair, Bed, Info, Check } from "lucide-react";

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
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      {/* Header & Deck Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Armchair className="w-5 h-5 text-blue-600" />
            Interactive Seat Selection
          </h3>
          <p className="text-xs text-slate-500">
            Select up to {maxSeats} seats. Real-time availability protected by row-level locking.
          </p>
        </div>

        {hasMultipleDecks && (
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveDeck("lower")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                activeDeck === "lower"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              Lower Deck
            </button>
            <button
              type="button"
              onClick={() => setActiveDeck("upper")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                activeDeck === "upper"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              Upper Deck
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-2 px-4 mb-6 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded border-2 border-emerald-500 bg-emerald-50" />
          <span className="text-slate-600 dark:text-slate-300">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-slate-600 dark:text-slate-300 font-medium">Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-slate-300 dark:bg-slate-700 text-slate-500" />
          <span className="text-slate-600 dark:text-slate-300">Booked / Unavailable</span>
        </div>
      </div>

      {/* Bus Blueprint Layout */}
      <div className="max-w-md mx-auto bg-white dark:bg-slate-950 rounded-2xl p-6 border-2 border-slate-300 dark:border-slate-700 shadow-md">
        {/* Driver Cabin Indicator */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b-2 border-dashed border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Front of Bus
          </span>
          <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400">
            <span className="text-xs font-bold">ST</span>
          </div>
        </div>

        {/* Rows Container */}
        <div className="space-y-3">
          {sortedRowKeys.map((rowKey) => {
            const rowSeats = rowsMap.get(rowKey) || [];
            // Sort by seat_column or seat_number
            rowSeats.sort((a, b) => (a.seat_column || 1) - (b.seat_column || 1));

            // Split into Left and Right aisle columns
            const is2x1 = layoutType.includes("2x1") || rowSeats.length <= 3;
            const leftColSeats = is2x1 ? rowSeats.slice(0, 1) : rowSeats.slice(0, 2);
            const rightColSeats = is2x1 ? rowSeats.slice(1) : rowSeats.slice(2);

            return (
              <div key={rowKey} className="flex items-center justify-between">
                {/* Left Column Seats */}
                <div className="flex items-center gap-2">
                  {leftColSeats.map((seat) => renderSeatButton(seat))}
                </div>

                {/* Aisle Space */}
                <div className="w-6 text-center text-[10px] text-slate-300 select-none">|</div>

                {/* Right Column Seats */}
                <div className="flex items-center gap-2">
                  {rightColSeats.map((seat) => renderSeatButton(seat))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rear Indicator */}
        <div className="pt-5 mt-5 border-t-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
          "relative flex flex-col items-center justify-center transition-all duration-150 rounded-lg font-mono",
          isSleeper ? "w-14 h-9 text-xs" : "w-10 h-10 text-xs",
          isBooked
            ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700 opacity-60"
            : isSelected
            ? "bg-blue-600 text-white shadow-md scale-105 border-2 border-blue-700 ring-2 ring-blue-300"
            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-400 shadow-sm hover:scale-105"
        )}
        title={`Seat ${seat.seat_number} - ${formatCurrency(seat.fare)} (${seat.status})`}
      >
        {isSleeper ? (
          <Bed className="w-3.5 h-3.5 mb-0.5 opacity-80" />
        ) : (
          <Armchair className="w-3.5 h-3.5 mb-0.5 opacity-80" />
        )}
        <span className="font-semibold text-[11px] leading-none">{seat.seat_number}</span>
      </button>
    );
  }
};

