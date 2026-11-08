"use client";

import React, { useEffect, useState, Suspense } from "react";
import { Booking } from "@/types";
import { TicketCard } from "@/components/booking/TicketCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Ticket, Search, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function PassengerBookingsContent() {
  const searchParams = useSearchParams();
  const highlightPnr = searchParams.get("pnr");
  const isSuccess = searchParams.get("success") === "true";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPnr, setSearchPnr] = useState(highlightPnr || "");
  const [pnrResult, setPnrResult] = useState<Booking | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/passenger/bookings");
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handlePnrSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPnr.trim()) return;

    setSearchError(null);
    try {
      const res = await fetch(`/api/bookings/pnr/${searchPnr.trim()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No booking found with this PNR");
      }
      setPnrResult(data.data);
    } catch (err: any) {
      setSearchError(err.message || "PNR search failed");
      setPnrResult(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner if redirected after booking */}
      {isSuccess && highlightPnr && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-bold text-sm">Booking Successfully Confirmed!</h3>
              <p className="text-xs text-emerald-700">
                Your PNR <strong>{highlightPnr}</strong> has been created with exclusive seat allocation.
              </p>
            </div>
          </div>
          <Link href="/search">
            <Button size="sm" variant="outline" className="text-xs font-semibold">
              Book Another Trip
            </Button>
          </Link>
        </div>
      )}

      {/* Header and Quick PNR Lookup */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-600" />
            My Bookings & Tickets
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View tickets, boarding details, or manage cancellations with simulated instant refunds.
          </p>
        </div>

        {/* PNR Search Form */}
        <form onSubmit={handlePnrSearch} className="flex items-center gap-2 max-w-sm w-full">
          <Input
            value={searchPnr}
            onChange={(e) => setSearchPnr(e.target.value)}
            placeholder="Quick Search PNR (e.g. ALG-XXXXXX)"
            className="text-xs uppercase font-mono h-9"
          />
          <Button type="submit" size="sm" className="bg-blue-600 text-white shrink-0">
            <Search className="w-4 h-4 mr-1" /> Search
          </Button>
        </form>
      </div>

      {/* Single PNR Search Result if active */}
      {pnrResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              PNR Search Result
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setPnrResult(null)} className="text-xs">
              Clear Filter
            </Button>
          </div>
          <TicketCard booking={pnrResult} onCancelSuccess={fetchBookings} />
        </div>
      )}

      {searchError && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
          {searchError}
        </div>
      )}

      {/* Passenger's Booking List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Recent Bookings ({bookings.length})
        </h2>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <TicketCard
                key={booking.id}
                booking={booking}
                onCancelSuccess={fetchBookings}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Ticket className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No bookings found yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Search for available intercity trips and book your preferred seats with instant confirmation.
            </p>
            <Link href="/search">
              <Button className="bg-blue-600 text-white font-semibold text-xs">
                Search Trips Now
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PassengerBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <PassengerBookingsContent />
    </Suspense>
  );
}
