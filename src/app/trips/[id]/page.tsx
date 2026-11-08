"use client";

import React, { useEffect, useState, use } from "react";
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
  const [contactName, setContactName] = useState("Ravi Ranjan");
  const [contactEmail, setContactEmail] = useState("passenger@algions.com");
  const [contactPhone, setContactPhone] = useState("+91 98765 00001");

  // Dynamic passengers state
  const [passengers, setPassengers] = useState<
    Array<{ fullName: string; age: number; gender: "male" | "female" | "other"; seatNumber: string }>
  >([]);

  // Load trip and seats
  const loadTripData = async () => {
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
  };

  useEffect(() => {
    loadTripData();
  }, [tripId]);

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

  const handlePassengerChange = (index: number, field: string, value: any) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const totalFare = selectedSeats.reduce((sum, s) => sum + Number(s.fare), 0);

  // Submit atomic booking
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (selectedSeats.length === 0) {
      setBookingError("Please select at least one seat.");
      return;
    }

    // Validate passengers
    for (const p of passengers) {
      if (!p.fullName.trim()) {
        setBookingError(`Please provide full name for seat ${p.seatNumber}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const idempotencyKey = crypto.randomUUID();
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
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Booking failed.");
      }

      // Success: redirect to passenger booking ticket view
      router.push(`/passenger/bookings?pnr=${data.data.pnr}&success=true`);
    } catch (err: any) {
      setBookingError(err.message || "Booking failed");
      // Refresh seat inventory to reflect any newly booked seats
      loadTripData();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Trip not found</h2>
        <Button onClick={() => router.push("/search")}>Back to Search</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Trip Information Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                {trip.operator?.name}
              </span>
              <Badge variant="secondary">{trip.vehicle?.layout_type}</Badge>
            </div>
            <p className="text-xs text-slate-500">
              Trip Code: {trip.trip_code} • Bus Model: {trip.vehicle?.model} ({trip.vehicle?.registration_number})
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div>
              <span className="text-xs font-semibold text-slate-400">Departure</span>
              <div className="text-lg font-bold">{formatTime(trip.departure_time)}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{trip.route?.origin_city}</p>
              <p className="text-[11px] text-slate-400">{formatDate(trip.departure_time)}</p>
            </div>

            <div className="text-center text-xs text-slate-400">
              <span>→</span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400">Arrival</span>
              <div className="text-lg font-bold">{formatTime(trip.arrival_time)}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{trip.route?.destination_city}</p>
              <p className="text-[11px] text-slate-400">{formatDate(trip.arrival_time)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Seat Map on Left, Passenger & Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Seat Map */}
        <div className="lg:col-span-7 space-y-4">
          <SeatMap
            seats={seats}
            selectedSeatIds={selectedSeats.map((s) => s.id)}
            onSeatToggle={handleSeatToggle}
            layoutType={trip.vehicle?.layout_type}
          />
        </div>

        {/* Right Column: Passenger Info & Booking Summary */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>Selected Seats ({selectedSeats.length})</span>
                <span className="text-blue-600 font-mono text-lg">{formatCurrency(totalFare)}</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-4 space-y-6">
              {/* Selected Seat Badges */}
              {selectedSeats.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((s) => (
                    <Badge key={s.id} className="bg-blue-600 text-white font-mono px-3 py-1 text-xs">
                      Seat {s.seat_number} ({formatCurrency(s.fare)})
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                  Click on an available seat from the bus blueprint to begin booking.
                </div>
              )}

              {/* Dynamic Passenger Forms */}
              {selectedSeats.length > 0 && (
                <form onSubmit={handleConfirmBooking} className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Passenger Information
                    </h4>

                    {passengers.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-600">
                            Passenger {idx + 1} (Seat {p.seatNumber})
                          </span>
                        </div>

                        <div>
                          <Label className="text-xs">Full Name</Label>
                          <Input
                            required
                            value={p.fullName}
                            onChange={(e) => handlePassengerChange(idx, "fullName", e.target.value)}
                            placeholder="e.g. Rahul Sharma"
                            className="mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Age</Label>
                            <Input
                              type="number"
                              min="1"
                              max="120"
                              required
                              value={p.age}
                              onChange={(e) => handlePassengerChange(idx, "age", Number(e.target.value))}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Gender</Label>
                            <select
                              value={p.gender}
                              onChange={(e) => handlePassengerChange(idx, "gender", e.target.value)}
                              className="w-full mt-1 h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm px-2"
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

                  {/* Contact Details */}
                  <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Contact Information
                    </h4>

                    <div>
                      <Label className="text-xs">Contact Person Name</Label>
                      <Input
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Email Address</Label>
                        <Input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Mobile Phone</Label>
                        <Input
                          required
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Error banner */}
                  {bookingError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* Submit CTA */}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Acquiring Row Locks...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Confirm Booking ({formatCurrency(totalFare)})
                      </>
                    )}
                  </Button>

                  <p className="text-[11px] text-center text-slate-400">
                    Guaranteed seat exclusivity through PostgreSQL transactions and FOR UPDATE locking.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

