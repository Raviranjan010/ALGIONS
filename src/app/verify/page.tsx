"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PublicTicketVerification } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RydvantaLogo } from "@/components/brand/RydvantaLogo";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bus,
  Calendar,
  Clock,
  MapPin,
  Lock,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

function VerifyTicketContent() {
  const searchParams = useSearchParams();
  const pnr = searchParams.get("pnr");

  const [ticket, setTicket] = useState<PublicTicketVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pnr) {
      setLoading(false);
      setError("No PNR provided in verification link.");
      return;
    }

    const cleanPnr = pnr.trim().toUpperCase();

    fetch(`/api/bookings/verify/${cleanPnr}`)
      .then((res) => {
        if (!res.ok) throw new Error("Ticket not found or invalid PNR");
        return res.json();
      })
      .then((data) => {
        if (data.success && data.data) {
          setTicket(data.data);
        } else {
          throw new Error(data.error || "Invalid ticket record");
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
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        <p className="text-xs text-charcoal-muted font-medium">Validating cryptographic PNR authenticity...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-charcoal-border rounded-3xl shadow-warm text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-charcoal">
          Invalid Boarding Pass
        </h2>
        <p className="text-xs text-charcoal-muted leading-relaxed">
          {error || "The scanned QR code does not match any confirmed booking in the Rydvanta system."}
        </p>
        <Link href="/">
          <Button size="sm" variant="outline" className="text-xs rounded-xl">
            Return to Homepage
          </Button>
        </Link>
      </div>
    );
  }

  const isValid = ticket.isValidForBoarding;
  const isCancelled = ticket.isCancelled;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      {/* Official Verification Header Banner */}
      <div
        className={`p-6 sm:p-7 rounded-3xl text-white shadow-warm-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isValid
            ? "bg-forest-deep"
            : "bg-charcoal"
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <RydvantaLogo variant="light" size="sm" asLink={false} />
            <span className="text-[10px] uppercase font-bold tracking-widest text-ivory-soft/80 pl-2 border-l border-white/20">
              Terminal Verification
            </span>
          </div>
          <h1 className="text-2xl font-black font-mono tracking-tight text-white mt-1">
            PNR: {ticket.pnr}
          </h1>
          <p className="text-xs text-ivory-soft/80">
            Validated at {new Date().toLocaleTimeString()} • Verified by Cryptographic Hash
          </p>
        </div>

        <div className="self-start sm:self-auto">
          {isValid ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Valid for Boarding</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white font-bold text-xs shadow-xs">
              <XCircle className="w-4 h-4" />
              <span>{isCancelled ? "Cancelled / Invalid" : "Invalid Ticket"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Verified Journey Card */}
      <div className="bg-white border border-charcoal-border/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-warm">
        {/* Route Details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-charcoal-border/50">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-muted block">
              Origin City
            </span>
            <span className="text-xl font-black text-charcoal block">
              {ticket.originCity}
            </span>
            <span className="text-xs text-forest font-bold flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-terracotta" />
              {formatTime(ticket.departureTime)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-charcoal-muted self-center">
            <div className="w-2 h-2 rounded-full bg-terracotta" />
            <div className="w-16 h-0.5 bg-charcoal-border" />
            <ArrowRight className="w-4 h-4 text-forest" />
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-muted block">
              Destination City
            </span>
            <span className="text-xl font-black text-charcoal block">
              {ticket.destinationCity}
            </span>
            <span className="text-xs text-forest font-bold flex items-center gap-1 sm:justify-end mt-0.5">
              <Clock className="w-3.5 h-3.5 text-forest" />
              {formatTime(ticket.arrivalTime)}
            </span>
          </div>
        </div>

        {/* Departure Date and Vehicle details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-2xl bg-ivory-soft/60 border border-charcoal-border/60">
            <span className="text-charcoal-muted text-[10px] font-bold uppercase block">
              Departure Date
            </span>
            <span className="font-bold text-charcoal">
              {formatDate(ticket.departureTime)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-ivory-soft/60 border border-charcoal-border/60">
            <span className="text-charcoal-muted text-[10px] font-bold uppercase block">
              Operator
            </span>
            <span className="font-bold text-charcoal">
              {ticket.operatorName}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-ivory-soft/60 border border-charcoal-border/60 col-span-2 sm:col-span-1">
            <span className="text-charcoal-muted text-[10px] font-bold uppercase block">
              Vehicle Reg
            </span>
            <span className="font-mono font-bold text-charcoal">
              {ticket.vehicleRegistration}
            </span>
          </div>
        </div>

        {/* Allocated Seats Count */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-ivory-light border border-charcoal-border/60">
          <div>
            <span className="text-xs font-bold text-charcoal block">
              Reserved Seats Allocation
            </span>
            <span className="text-[11px] text-charcoal-muted">
              {ticket.seatCount} {ticket.seatCount === 1 ? "seat" : "seats"} confirmed on vehicle manifest
            </span>
          </div>
          <span className="px-3.5 py-1 rounded-xl bg-forest text-white font-mono font-bold text-sm">
            {ticket.seatCount} {ticket.seatCount === 1 ? "Seat" : "Seats"}
          </span>
        </div>

        {/* Strict Zero-PII Security Assurance */}
        <div className="p-4 rounded-2xl bg-ivory-soft border border-charcoal-border/60 text-xs text-charcoal-muted space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-forest">
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Privacy Protection</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            In compliance with strict privacy requirements, passenger names, contact numbers, email addresses, and payment data are withheld from public scanning.
          </p>
        </div>

        <div className="pt-2 text-center">
          <Link href="/">
            <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl border-charcoal-border">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyTicketPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        </div>
      }
    >
      <VerifyTicketContent />
    </Suspense>
  );
}
