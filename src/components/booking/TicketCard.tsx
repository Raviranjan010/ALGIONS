"use client";

import React, { useState } from "react";
import { Booking } from "@/types";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bus,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  AlertTriangle,
  MapPin,
  Printer,
  ShieldCheck,
  User,
  XCircle,
  Armchair,
} from "lucide-react";
import { QRCodeView } from "@/components/booking/QRCodeView";
import { RydvantaLogo } from "@/components/brand/RydvantaLogo";

interface TicketCardProps {
  booking: Booking;
  onCancelSuccess?: () => void;
  allowCancel?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  booking,
  onCancelSuccess,
  allowCancel = true,
}) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Change of travel plans");
  const [cancelError, setCancelError] = useState<string | null>(null);

  const isConfirmed = booking.status === "confirmed";
  const isCancelled = booking.status === "cancelled";

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          reason: cancelReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel booking");
      }
      setShowCancelModal(false);
      if (onCancelSuccess) onCancelSuccess();
      else window.location.reload();
    } catch (err: any) {
      setCancelError(err.message || "An error occurred");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="bg-white border border-charcoal-border/80 rounded-3xl shadow-warm-lg overflow-hidden max-w-3xl mx-auto transition-all">
      {/* Ticket Top Banner */}
      <div
        className={`p-6 sm:p-7 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isCancelled ? "bg-charcoal" : "bg-forest-deep"
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <RydvantaLogo variant="light" size="sm" asLink={false} />
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-80 pl-2 border-l border-white/20">
              Official e-Ticket / Boarding Pass
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-1">
            PNR: {booking.pnr}
          </h2>
          <p className="text-xs text-ivory-soft/80 font-medium">
            Booked on {formatDate(booking.created_at)} at {formatTime(booking.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isConfirmed && (
            <span className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 className="w-4 h-4" /> Confirmed
            </span>
          )}
          {isCancelled && (
            <Badge variant="destructive" className="px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <XCircle className="w-4 h-4" /> Cancelled
            </Badge>
          )}
        </div>
      </div>

      {/* Ticket Body with Perforated Edge Effect */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Journey Timeline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-5 rounded-2xl bg-ivory-soft/70 border border-charcoal-border/70">
          <div className="text-left space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-muted block">
              Origin / Departure
            </span>
            <span className="text-xl font-black text-charcoal block">
              {booking.trip?.route?.origin_city || "Origin"}
            </span>
            <span className="text-xs text-forest font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-terracotta" />
              {booking.trip?.departure_time ? formatTime(booking.trip.departure_time) : "TBD"}
            </span>
            <span className="text-[11px] text-charcoal-muted block">
              {booking.trip?.departure_time ? formatDate(booking.trip.departure_time) : ""}
            </span>
          </div>

          <div className="flex flex-col items-center px-4">
            <span className="text-[11px] font-bold text-forest uppercase tracking-wider">
              {booking.trip?.operator?.name || "Rydvanta Express"}
            </span>
            <div className="flex items-center gap-2 my-1">
              <div className="w-2.5 h-2.5 rounded-full bg-terracotta" />
              <div className="w-20 sm:w-28 h-0.5 bg-charcoal-border dashed" />
              <div className="w-2.5 h-2.5 rounded-full bg-forest" />
            </div>
            <span className="text-[10px] text-charcoal-muted font-medium">
              Reg: {booking.trip?.vehicle?.registration_number || "MH-01"}
            </span>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-muted block">
              Destination / Arrival
            </span>
            <span className="text-xl font-black text-charcoal block">
              {booking.trip?.route?.destination_city || "Destination"}
            </span>
            <span className="text-xs text-forest font-bold flex items-center gap-1 sm:justify-end">
              <Clock className="w-3.5 h-3.5 text-forest" />
              {booking.trip?.arrival_time ? formatTime(booking.trip.arrival_time) : "TBD"}
            </span>
            <span className="text-[11px] text-charcoal-muted block">
              {booking.trip?.arrival_time ? formatDate(booking.trip.arrival_time) : ""}
            </span>
          </div>
        </div>

        {/* Passenger & Ticket Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Passengers List */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
              <User className="w-4 h-4 text-terracotta" />
              Passenger Manifest ({booking.items?.length || 1})
            </h4>

            <div className="divide-y divide-charcoal-border/50 rounded-2xl border border-charcoal-border/70 overflow-hidden bg-white">
              {booking.items && booking.items.length > 0 ? (
                booking.items.map((item, idx) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-charcoal block">
                        {item.passenger_name || `Passenger ${idx + 1}`}
                      </span>
                      <span className="text-[11px] text-charcoal-muted">
                        Age: {item.passenger_age || "N/A"} • Gender: {item.passenger_gender || "N/A"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-terracotta text-white font-mono font-bold text-xs shadow-xs">
                        <Armchair className="w-3.5 h-3.5" />
                        Seat {item.seat?.seat_number || "N/A"}
                      </span>
                      <span className="text-[11px] text-charcoal-muted block mt-0.5 font-medium">
                        {formatCurrency(item.fare_at_booking)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-xs text-charcoal-muted">No itemized details</div>
              )}
            </div>

            {/* Contact Details */}
            <div className="p-3.5 rounded-2xl bg-ivory-soft/60 border border-charcoal-border/60 text-xs space-y-1">
              <span className="font-bold text-charcoal block">Primary Contact Details:</span>
              <p className="text-charcoal-muted">
                <strong>Name:</strong> {booking.contact_name} • <strong>Email:</strong> {booking.contact_email} • <strong>Phone:</strong> {booking.contact_phone}
              </p>
            </div>
          </div>

          {/* QR Code Scannable Verification Pass */}
          <div className="flex flex-col items-center justify-center p-4 bg-ivory-light rounded-2xl border border-charcoal-border/70 space-y-2 text-center">
            <span className="text-xs font-bold text-charcoal">Digital Boarding Pass</span>
            <QRCodeView pnr={booking.pnr} size={130} />
            <p className="text-[10px] text-charcoal-muted max-w-[150px]">
              Scan to verify boarding pass authenticity at the terminal.
            </p>
          </div>
        </div>

        {/* Financial Summary & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-charcoal-border/60">
          <div>
            <span className="text-xs text-charcoal-muted font-medium block">Total Paid (Inclusive of GST)</span>
            <span className="text-2xl font-black text-charcoal">
              {formatCurrency(booking.total_amount)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs font-bold gap-1.5 rounded-xl border-charcoal-border"
            >
              <Printer className="w-3.5 h-3.5" /> Print Ticket
            </Button>

            {isConfirmed && allowCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="text-xs font-bold gap-1.5 rounded-xl"
              >
                Cancel Booking
              </Button>
            )}
          </div>
        </div>

        {/* Cancellation Details if Cancelled */}
        {isCancelled && booking.cancellation && (
          <div className="p-4 rounded-2xl bg-ivory-soft border border-charcoal-border text-xs space-y-1 text-charcoal">
            <div className="flex items-center gap-1.5 font-bold text-red-600">
              <XCircle className="w-4 h-4" />
              <span>Booking Cancelled on {formatDate(booking.cancellation.created_at)}</span>
            </div>
            <p className="text-charcoal-muted">
              Refund Amount: <strong>{formatCurrency(booking.cancellation.refund_amount)}</strong> • Cancellation Fee: {formatCurrency(booking.cancellation.cancellation_fee)}
            </p>
            <p className="text-[11px] text-charcoal-muted">
              Refund Status: <strong>{booking.cancellation.refund_status.toUpperCase()}</strong> (Simulated instant refund completed)
            </p>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-warm-lg border border-charcoal-border animate-in fade-in">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-charcoal">Confirm Cancellation</h3>
                <p className="text-xs text-charcoal-muted">PNR: {booking.pnr}</p>
              </div>
            </div>

            <p className="text-xs text-charcoal-muted leading-relaxed">
              Are you sure you want to cancel this booking? Once cancelled, seats will be immediately released back into live inventory for other passengers.
            </p>

            {/* Refund Tier Guidance */}
            <div className="p-3.5 rounded-xl bg-ivory-soft border border-charcoal-border/70 text-xs space-y-1">
              <span className="font-bold text-forest block">Simulated Refund Policy:</span>
              <ul className="text-[11px] text-charcoal-muted space-y-0.5 list-disc pl-4">
                <li>&gt; 24h prior: 90% refund (10% fee)</li>
                <li>12h to 24h: 50% refund (50% fee)</li>
                <li>4h to 12h: 25% refund (75% fee)</li>
                <li>&lt; 4h: 0% refund</li>
              </ul>
            </div>

            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">
                Reason for cancellation:
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-charcoal-border focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
            </div>

            {cancelError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-charcoal-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="text-xs font-semibold rounded-xl"
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="text-xs font-bold rounded-xl"
              >
                {isCancelling ? "Cancelling..." : "Confirm & Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
