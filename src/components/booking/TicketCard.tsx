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
} from "lucide-react";
import { QRCodeView } from "@/components/booking/QRCodeView";

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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden max-w-3xl mx-auto">
      {/* Ticket Header */}
      <div
        className={`p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isCancelled ? "bg-slate-700" : "bg-gradient-to-r from-blue-700 to-indigo-800"
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest font-semibold opacity-90">
              Official e-Ticket / Boarding Pass
            </span>
          </div>
          <h2 className="text-2xl font-black font-mono tracking-tight mt-1">
            PNR: {booking.pnr}
          </h2>
          <p className="text-xs opacity-80">
            Booked on {formatDate(booking.created_at)} at {formatTime(booking.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isConfirmed && (
            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1 text-sm font-bold flex items-center gap-1.5 shadow">
              <CheckCircle2 className="w-4 h-4" /> Confirmed
            </Badge>
          )}
          {isCancelled && (
            <Badge variant="destructive" className="px-3 py-1 text-sm font-bold flex items-center gap-1.5 shadow">
              <XCircle className="w-4 h-4" /> Cancelled
            </Badge>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Journey Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 items-center">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Departure
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {booking.trip ? formatTime(booking.trip.departure_time) : "--:--"}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {booking.trip?.route?.origin_city || "Origin City"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {booking.trip ? formatDate(booking.trip.departure_time) : ""}
            </p>
          </div>

          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Arrival
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {booking.trip ? formatTime(booking.trip.arrival_time) : "--:--"}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {booking.trip?.route?.destination_city || "Destination City"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {booking.trip ? formatDate(booking.trip.arrival_time) : ""}
            </p>
          </div>

          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Operator & Bus
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
              {booking.trip?.operator?.name || "Transit Operator"}
            </div>
            <p className="text-xs text-slate-500">
              Trip: {booking.trip?.trip_code || "N/A"}
            </p>
            <p className="text-xs text-slate-500">
              Reg: {booking.trip?.vehicle?.registration_number || "N/A"}
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <QRCodeView pnr={booking.pnr} size={96} />
          </div>
        </div>

        {/* Passenger Manifest for this Ticket */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Passenger & Seat Details
          </h4>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Passenger Name</th>
                  <th className="py-2.5 px-4">Age / Gender</th>
                  <th className="py-2.5 px-4">Seat Number</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {booking.passengers && booking.passengers.length > 0 ? (
                  booking.passengers.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {p.full_name}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 capitalize">
                        {p.age} yrs • {p.gender}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-mono font-bold px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {p.seat_number}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`text-xs font-semibold ${isConfirmed ? "text-emerald-600" : "text-red-500"}`}>
                          {isConfirmed ? "Confirmed" : "Released"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      No passengers listed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contact & Fare Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">
              Primary Contact
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">
              {booking.contact_name}
            </p>
            <p className="text-xs text-slate-500">{booking.contact_email} • {booking.contact_phone}</p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs font-semibold uppercase text-slate-400">
              Total Fare Paid
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {formatCurrency(booking.total_fare)}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium">Inclusive of all transit taxes</p>
          </div>
        </div>

        {/* Cancellation Summary If Cancelled */}
        {isCancelled && booking.cancellation && (
          <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Cancellation & Simulated Refund Summary
              </span>
              <Badge variant="outline" className="border-red-300 text-red-700 text-xs">
                {booking.cancellation.refund_status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm pt-2">
              <div>
                <span className="text-xs text-slate-500">Reason</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">{booking.cancellation.reason}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Refund Policy Applied</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">{booking.cancellation.refund_percentage}% of fare</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Simulated Refund Amount</span>
                <p className="font-bold text-emerald-600 text-base">{formatCurrency(booking.cancellation.refund_amount)}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Note: As per system specification, this is a simulated refund credit to the original payment method.
            </p>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" /> Print Ticket
            </Button>
          </div>

          {isConfirmed && allowCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="text-xs font-semibold"
            >
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Confirm Cancellation
              </h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to cancel booking <strong>{booking.pnr}</strong>? All booked seats will be released back to the inventory immediately.
            </p>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-semibold">Cancellation Policy:</p>
              <p>• &gt;24h before departure: 90% refund (10% cancellation charge)</p>
              <p>• 12h–24h before: 75% refund</p>
              <p>• 2h–12h before: 50% refund</p>
              <p>• &lt;2h before: 0% refund (Non-refundable)</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reason for Cancellation
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-transparent"
                placeholder="e.g. Change in schedule"
              />
            </div>

            {cancelError && (
              <p className="text-xs text-red-600 font-semibold">{cancelError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelBooking}
                disabled={isCancelling}
              >
                {isCancelling ? "Processing..." : "Confirm & Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

