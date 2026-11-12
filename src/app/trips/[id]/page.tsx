"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Trip, TripSeat } from "@/types";
import { SeatMap } from "@/components/booking/SeatMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import {
  Bus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Loader2,
  ArrowRight,
  Armchair,
} from "lucide-react";

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tripId } = use(params);
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<TripSeat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<TripSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Contact info
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Dynamic passengers state
  const [passengers, setPassengers] = useState<
    Array<{ fullName: string; age: number; gender: "male" | "female" | "other"; seatNumber: string }>
  >([]);

  // Load trip and seats
  const loadTripData = useCallback(async () => {
    try {
      const [tripRes, seatsRes] = await Promise.all([
        fetch(`/api/trips/${tripId}`),
        fetch(`/api/trips/${tripId}/seats`),
      ]);
      const tripData = await tripRes.json();
      const seatsData = await seatsRes.json();

      if (tripData.success) setTrip(tripData.data);
      if (seatsData.success) setSeats(seatsData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTripData();
  }, [loadTripData]);

  // Handle seat toggle
  const handleSeatToggle = (seat: TripSeat) => {
    const isAlreadySelected = selectedSeats.some((s) => s.id === seat.id);

    if (isAlreadySelected) {
      const updated = selectedSeats.filter((s) => s.id !== seat.id);
      setSelectedSeats(updated);
      setPassengers(passengers.filter((p) => p.seatNumber !== seat.seat_number));
    } else {
      if (selectedSeats.length >= 6) {
        alert("Maximum 6 seats can be booked in a single transaction.");
        return;
      }
      const updated = [...selectedSeats, seat];
      setSelectedSeats(updated);
      setPassengers([
        ...passengers,
        {
          fullName: "",
          age: 25,
          gender: "male",
          seatNumber: seat.seat_number,
        },
      ]);
    }
    setBookingError(null);
  };

  const handlePassengerChange = (
    index: number,
    field: "fullName" | "age" | "gender",
    value: string | number
  ) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  // Calculate pricing
  const baseTotal = selectedSeats.reduce((sum, s) => sum + (Number(s.fare) || Number(trip?.base_fare) || 0), 0);
  const gstAmount = Math.round(baseTotal * 0.05); // 5% GST
  const grandTotal = baseTotal + gstAmount;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSeats.length === 0) {
      setBookingError("Please select at least one seat on the seat map.");
      return;
    }

    // Validate passenger names
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].fullName.trim()) {
        setBookingError(`Please enter passenger name for seat ${passengers[i].seatNumber}.`);
        return;
      }
    }

    setSubmitting(true);
    setBookingError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          seatIds: selectedSeats.map((s) => s.id),
          passengers,
          contact: {
            name: contactName,
            email: contactEmail,
            phone: contactPhone,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = typeof data.error === "string" ? data.error : data.error?.message;
        throw new Error(message || "Booking transaction failed. Seats may have just been reserved.");
      }

      router.push(`/passenger/bookings?pnr=${data.data.pnr}&success=true`);
    } catch (err: any) {
      setBookingError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        <p className="text-xs text-charcoal-muted font-medium">Loading real-time trip schedules & seat matrix...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-charcoal-border rounded-3xl text-center space-y-4 shadow-warm">
        <AlertCircle className="w-12 h-12 text-terracotta mx-auto" />
        <h2 className="text-xl font-bold text-charcoal">Trip Not Found</h2>
        <p className="text-xs text-charcoal-muted">
          The requested trip ID could not be loaded from the database schedule.
        </p>
        <Button onClick={() => router.push("/search")} className="text-xs font-bold rounded-xl">
          Return to Trips
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Trip Information Top Banner */}
      <div className="bg-forest-deep text-white rounded-3xl p-6 sm:p-8 shadow-warm-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ivory-soft/20 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">
                {trip.operator?.name || "Rydvanta Prime Express"}
              </span>
              <Badge variant="sage" className="text-[10px] uppercase font-mono">
                {trip.vehicle?.layout_type || "2x2 AC Seater"}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              {trip.route?.origin_city} → {trip.route?.destination_city}
            </h1>
            <p className="text-xs text-ivory-soft/80 flex items-center gap-2 mt-1">
              <Bus className="w-3.5 h-3.5 text-terracotta" />
              <span>{trip.vehicle?.model} • Reg: {trip.vehicle?.registration_number}</span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-ivory-soft/70 block">Departure Date</span>
            <span className="text-lg font-bold text-white block">
              {formatDate(trip.departure_time)}
            </span>
            <span className="text-xs text-amber-300 font-mono">
              Starts at {formatTime(trip.departure_time)}
            </span>
          </div>
        </div>

        {/* Departure & Arrival Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-terracotta" />
            <span>
              <strong>Departure:</strong> {formatTime(trip.departure_time)} ({trip.route?.origin_city})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>Arrival:</strong> {formatTime(trip.arrival_time)} ({trip.route?.destination_city})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero Double-Booking Guarantee</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Seat Map, Right Booking Summary Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Seat Map Column */}
        <div className="lg:col-span-7 space-y-4">
          <SeatMap
            seats={seats}
            selectedSeatIds={selectedSeats.map((s) => s.id)}
            onSeatToggle={handleSeatToggle}
            layoutType={trip.vehicle?.layout_type}
          />
        </div>

        {/* Booking Form / Passenger Details Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-3xl border-charcoal-border/80 shadow-warm">
            <CardHeader className="pb-4 border-b border-charcoal-border/50">
              <CardTitle className="text-lg font-extrabold text-charcoal flex items-center justify-between">
                <span>Booking Summary</span>
                <Badge variant="terracotta" className="text-xs">
                  {selectedSeats.length} {selectedSeats.length === 1 ? "Seat" : "Seats"} Selected
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-5 space-y-6">
              {bookingError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Selected Seats Pills */}
              {selectedSeats.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-charcoal uppercase tracking-wider block">
                    Selected Seats:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-terracotta text-white font-mono text-xs font-bold shadow-xs"
                      >
                        <Armchair className="w-3.5 h-3.5" />
                        <span>Seat {s.seat_number}</span>
                        <span className="text-[10px] opacity-80">({formatCurrency(s.fare)})</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-ivory-soft border border-charcoal-border/60 text-center space-y-1">
                  <Armchair className="w-6 h-6 text-charcoal-muted mx-auto" />
                  <p className="text-xs font-bold text-charcoal">No Seats Selected</p>
                  <p className="text-[11px] text-charcoal-muted">
                    Click available seats on the blueprint to reserve them.
                  </p>
                </div>
              )}

              {/* Passenger Inputs Form */}
              <form onSubmit={handleBookingSubmit} className="space-y-5">
                {selectedSeats.length > 0 && (
                  <div className="space-y-4 pt-2 border-t border-charcoal-border/40">
                    <span className="text-xs font-bold text-charcoal uppercase tracking-wider block">
                      Passenger Information:
                    </span>
                    {passengers.map((passenger, idx) => (
                      <div
                        key={passenger.seatNumber}
                        className="p-3.5 rounded-2xl bg-ivory-light border border-charcoal-border/70 space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-charcoal">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-terracotta" />
                            Passenger {idx + 1}
                          </span>
                          <span className="font-mono text-forest bg-sage-surface px-2 py-0.5 rounded-md border border-sage">
                            Seat {passenger.seatNumber}
                          </span>
                        </div>

                        <div>
                          <Label className="text-[11px] font-semibold text-charcoal-muted">
                            Full Name
                          </Label>
                          <Input
                            placeholder="e.g. Ramesh Sharma"
                            value={passenger.fullName}
                            onChange={(e) =>
                              handlePassengerChange(idx, "fullName", e.target.value)
                            }
                            required
                            className="h-10 text-xs mt-1 font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[11px] font-semibold text-charcoal-muted">
                              Age
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              max={120}
                              value={passenger.age}
                              onChange={(e) =>
                                handlePassengerChange(idx, "age", Number(e.target.value))
                              }
                              required
                              className="h-10 text-xs mt-1 font-semibold"
                            />
                          </div>

                          <div>
                            <Label className="text-[11px] font-semibold text-charcoal-muted">
                              Gender
                            </Label>
                            <select
                              value={passenger.gender}
                              onChange={(e) =>
                                handlePassengerChange(
                                  idx,
                                  "gender",
                                  e.target.value as "male" | "female" | "other"
                                )
                              }
                              className="w-full h-10 px-3 mt-1 text-xs font-semibold text-charcoal bg-white border border-charcoal-border rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/40"
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Primary Contact Details */}
                <div className="space-y-3 pt-2 border-t border-charcoal-border/40">
                  <span className="text-xs font-bold text-charcoal uppercase tracking-wider block">
                    Contact Details for e-Ticket:
                  </span>

                  <div>
                    <Label className="text-[11px] font-semibold text-charcoal-muted">
                      Contact Name
                    </Label>
                    <Input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      className="h-10 text-xs mt-1 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold text-charcoal-muted">
                        Email Address
                      </Label>
                      <Input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                        className="h-10 text-xs mt-1 font-semibold"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-charcoal-muted">
                        Phone Number
                      </Label>
                      <Input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        required
                        className="h-10 text-xs mt-1 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Fare Breakdown */}
                <div className="space-y-2 pt-4 border-t border-charcoal-border/50 text-xs">
                  <div className="flex justify-between text-charcoal-muted font-medium">
                    <span>Base Fare ({selectedSeats.length} seats)</span>
                    <span>{formatCurrency(baseTotal)}</span>
                  </div>
                  <div className="flex justify-between text-charcoal-muted font-medium">
                    <span>GST (5%)</span>
                    <span>{formatCurrency(gstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-charcoal pt-2 border-t border-charcoal-border/50">
                    <span>Total Amount</span>
                    <span className="text-terracotta">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting || selectedSeats.length === 0}
                  className="w-full h-12 text-sm font-bold bg-terracotta hover:bg-terracotta-hover text-white rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Locking Seats & Generating Ticket...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Book ({formatCurrency(grandTotal)})</span>
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-charcoal-muted text-center leading-tight">
                  🔒 Seats are locked exclusively in PostgreSQL with row-level locks. Instant simulated refund available upon cancellation.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
