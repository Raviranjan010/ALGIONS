"use client";

import React, { useEffect, useState, Suspense } from "react";
import { Booking } from "@/types";
import { TicketCard } from "@/components/booking/TicketCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Ticket, Search, CheckCircle2, Loader2, Sparkles } from "lucide-react";
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
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between shadow-xs gap-3">
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
            <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl border-emerald-300">
              Book Another Trip
            </Button>
          </Link>
        </div>
      )}

      {/* Header and Quick PNR Lookup */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-charcoal-border/70 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal flex items-center gap-2">
            <Ticket className="w-6 h-6 text-terracotta" />
            My Bookings & Tickets
          </h1>
          <p className="text-xs text-charcoal-muted mt-1">
            View tickets, boarding details, or manage cancellations with simulated instant refunds.
          </p>
        </div>

        {/* PNR Search Form */}
        <form onSubmit={handlePnrSearch} className="flex items-center gap-2 max-w-sm w-full">
          <Input
            value={searchPnr}
            onChange={(e) => setSearchPnr(e.target.value)}
            placeholder="Quick Search PNR (e.g. ALG-XXXXXX)"
            className="text-xs uppercase font-mono h-10 rounded-xl"
          />
          <Button type="submit" size="sm" className="h-10 px-4 text-xs font-bold bg-terracotta text-white rounded-xl shrink-0">
            <Search className="w-3.5 h-3.5 mr-1" /> Look Up
          </Button>
        </form>
      </div>

      {/* Individual PNR Search Result if active */}
      {pnrResult && (
        <div className="space-y-3 p-6 bg-ivory-soft/60 rounded-3xl border border-charcoal-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-forest">
              Lookup Result for PNR: {pnrResult.pnr}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPnrResult(null)}
              className="text-xs"
            >
              Clear Result
            </Button>
          </div>
          <TicketCard booking={pnrResult} onCancelSuccess={fetchBookings} />
        </div>
      )}

      {searchError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
          {searchError}
        </div>
      )}

      {/* Main Bookings List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-charcoal">
          Your Recent Reservations ({bookings.length})
        </h2>

        {loading ? (
          <div className="min-h-[30vh] flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-terracotta" />
            <p className="text-xs text-charcoal-muted font-medium">Retrieving passenger tickets...</p>
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
          <div className="bg-white border border-charcoal-border rounded-3xl p-12 text-center space-y-4 shadow-warm max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-ivory-soft text-terracotta border border-charcoal-border flex items-center justify-center mx-auto">
              <Ticket className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-charcoal">
              No Bookings Found Yet
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              You haven&apos;t booked any tickets yet. Explore our scheduled routes and experience real-time seat reservation with instant confirmation.
            </p>
            <Link href="/search">
              <Button size="sm" className="text-xs font-bold bg-terracotta text-white rounded-xl mt-2">
                Search & Book Buses
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
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        </div>
      }
    >
      <PassengerBookingsContent />
    </Suspense>
  );
}
