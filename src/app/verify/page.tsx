"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Booking } from "@/types";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bus,
  Calendar,
  Clock,
  MapPin,
  User,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

function VerifyTicketContent() {
  const searchParams = useSearchParams();
  const pnr = searchParams.get("pnr");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pnr) {
      setLoading(false);
      setError("No PNR provided in verification link.");
      return;
    }

    fetch(`/api/bookings/pnr/${pnr.trim().toUpperCase()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Ticket not found or invalid PNR");
        return res.json();
      })
      .then((data) => {
        if (data.success && data.data) {
          setBooking(data.data);
        } else {
          throw new Error("Invalid ticket record");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to verify ticket");
      })
      .finally(() => setLoading(false));
  }, [pnr]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-500 font-medium">Validating cryptographic PNR authenticity...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Invalid Boarding Pass
        </h2>
        <p className="text-xs text-slate-500">
          {error || "The scanned QR code does not match any confirmed booking in the ALGIONS system."}
        </p>
        <Link href="/">
          <Button size="sm" variant="outline" className="text-xs">
            Return to Homepage
          </Button>
        </Link>
      </div>
    );
  }

  const isConfirmed = booking.status === "confirmed";
  const isCancelled = booking.status === "cancelled";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Official Verification Header */}
      <div
        className={`p-6 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isConfirmed
            ? "bg-gradient-to-r from-emerald-600 to-teal-700"
            : "bg-gradient-to-r from-red-600 to-rose-700"
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-white" />
            <span className="text-xs uppercase tracking-wider font-bold opacity-90">
              Verified Digital Boarding Pass
            </span>
          </div>
          <h1 className="text-2xl font-black font-mono">PNR: {booking.pnr}</h1>
          <p className="text-xs opacity-90">
            Authenticated via ALGIONS Concurrency & Dispatch Engine
          </p>
        </div>

        <div>
          {isConfirmed ? (
            <Badge className="bg-white text-emerald-800 font-bold px-3 py-1 text-sm shadow">
              <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" /> VALID FOR BOARDING
            </Badge>
          ) : (
            <Badge className="bg-white text-red-800 font-bold px-3 py-1 text-sm shadow">
              <XCircle className="w-4 h-4 mr-1 text-red-600" /> TICKET CANCELLED
            </Badge>
          )}
        </div>
      </div>

      {/* Ticket Details */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Route Corridor */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Departure</span>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {booking.trip ? formatTime(booking.trip.departure_time) : ""}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {booking.trip?.route?.origin_city}
            </p>
            <p className="text-[11px] text-slate-400">{booking.trip ? formatDate(booking.trip.departure_time) : ""}</p>
          </div>

          <div className="text-slate-300">━━━━►</div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-semibold uppercase">Arrival</span>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {booking.trip ? formatTime(booking.trip.arrival_time) : ""}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {booking.trip?.route?.destination_city}
            </p>
            <p className="text-[11px] text-slate-400">{booking.trip ? formatDate(booking.trip.arrival_time) : ""}</p>
          </div>
        </div>

        {/* Bus & Operator */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 uppercase font-semibold">Operator</span>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {booking.trip?.operator?.name}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold">Assigned Bus</span>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {booking.trip?.vehicle?.model} ({booking.trip?.vehicle?.registration_number})
            </p>
          </div>
        </div>

        {/* Passenger Manifest Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Passenger & Seat Allocation
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-sm">
            {booking.passengers?.map((p, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{p.full_name}</span>
                  <p className="text-xs text-slate-500 capitalize">{p.age} yrs • {p.gender}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs">
                    Seat {p.seat_number}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Notes */}
        {isCancelled && booking.cancellation && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 space-y-1">
            <p className="font-bold">Cancellation Notice:</p>
            <p>Reason: {booking.cancellation.reason}</p>
            <p>Refund Policy Applied: {booking.cancellation.refund_percentage}% ({formatCurrency(booking.cancellation.refund_amount)})</p>
            <p>Seat reservations have been released back to general inventory.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyTicketPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <VerifyTicketContent />
    </Suspense>
  );
}
