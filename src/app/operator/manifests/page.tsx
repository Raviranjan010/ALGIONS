"use client";

import React, { useEffect, useState, Suspense } from "react";
import { Trip, PassengerManifestItem } from "@/types";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileSpreadsheet,
  Printer,
  Bus,
  CheckCircle2,
  Users,
  Search,
  Loader2,
  Armchair,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

function OperatorManifestsContent() {
  const searchParams = useSearchParams();
  const initialTripId = searchParams.get("tripId") || "";

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState(initialTripId);
  const [manifest, setManifest] = useState<PassengerManifestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Load all trips
  useEffect(() => {
    fetch("/api/trips/search?origin=&destination=&date=")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setTrips(data.data);
          setSelectedTripId((prev) => prev || data.data[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load manifest when trip changes
  useEffect(() => {
    if (!selectedTripId) return;

    fetch(`/api/operator/manifests?tripId=${selectedTripId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setManifest(data.data);
        }
      })
      .catch(console.error);
  }, [selectedTripId]);

  const currentTrip = trips.find((t) => t.id === selectedTripId);

  // Filter manifest by search term (passenger name, PNR, seat)
  const filteredManifest = manifest.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.passenger_name.toLowerCase().includes(term) ||
      item.pnr.toLowerCase().includes(term) ||
      item.seat_number.toLowerCase().includes(term) ||
      item.contact_phone.includes(term)
    );
  });

  const confirmedPassengers = manifest.filter((m) => m.booking_status === "confirmed");
  const cancelledPassengers = manifest.filter((m) => m.booking_status === "cancelled");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-charcoal-border/70 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-terracotta" />
            Passenger Dispatch Manifest
          </h1>
          <p className="text-xs text-charcoal-muted mt-1">
            Real-time boarding manifest reconciled with confirmed seat inventory and passenger records.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold gap-1.5 rounded-xl border-charcoal-border"
          >
            <Printer className="w-4 h-4" /> Print Manifest
          </Button>
        </div>
      </div>

      {/* Trip Selector & Search Filter Bar */}
      <div className="bg-white border border-charcoal-border/80 rounded-3xl p-5 sm:p-6 shadow-warm space-y-4 no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-muted block mb-1.5">
              Select Scheduled Departure
            </label>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full h-11 rounded-xl border border-charcoal-border bg-white px-3.5 text-xs font-bold text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/40"
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.trip_code} — {t.route?.origin_city} to {t.route?.destination_city} (
                  {formatDate(t.departure_time)} at {formatTime(t.departure_time)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-muted block mb-1.5">
              Filter Manifest
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by passenger name, PNR, or seat..."
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-charcoal-border bg-white text-xs font-semibold text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selected Trip Details & Reconciliation Counters */}
      {currentTrip && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-charcoal-border shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-charcoal-muted">
                Vehicle Assigned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold text-charcoal">
                {currentTrip.vehicle?.model}
              </div>
              <p className="text-[11px] text-charcoal-muted font-mono">
                Reg: {currentTrip.vehicle?.registration_number}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-charcoal-border shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-charcoal-muted">
                Confirmed Passengers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-forest">
                {confirmedPassengers.length}
              </div>
              <p className="text-[11px] text-charcoal-muted">
                Ready for terminal boarding
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-charcoal-border shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-charcoal-muted">
                Cancelled / Released
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-charcoal-muted">
                {cancelledPassengers.length}
              </div>
              <p className="text-[11px] text-charcoal-muted">
                Seats restored to inventory
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-charcoal-border shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-charcoal-muted">
                Total Seats Allocated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-terracotta">
                {manifest.length}
              </div>
              <p className="text-[11px] text-charcoal-muted">
                All records tracked in audit trail
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manifest Table */}
      <div className="bg-white rounded-3xl border border-charcoal-border/80 overflow-hidden shadow-warm">
        <div className="p-5 border-b border-charcoal-border/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-charcoal flex items-center gap-2">
            <Users className="w-4 h-4 text-forest" />
            Passenger Dispatch Roster ({filteredManifest.length})
          </h2>
          <span className="text-[11px] font-mono text-charcoal-muted">
            Trip: {currentTrip?.trip_code}
          </span>
        </div>

        {filteredManifest.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-soft text-charcoal font-bold uppercase tracking-wider border-b border-charcoal-border/70">
                <tr>
                  <th className="px-5 py-3.5">Seat</th>
                  <th className="px-5 py-3.5">Passenger Name</th>
                  <th className="px-5 py-3.5">Age/Gender</th>
                  <th className="px-5 py-3.5">PNR Number</th>
                  <th className="px-5 py-3.5">Contact Phone</th>
                  <th className="px-5 py-3.5">Fare</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/50 text-charcoal">
                {filteredManifest.map((item) => {
                  const isConfirmed = item.booking_status === "confirmed";
                  return (
                    <tr
                      key={item.booking_item_id}
                      className={isConfirmed ? "hover:bg-ivory-light" : "bg-ivory-soft/30 opacity-60"}
                    >
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-lg bg-ivory-soft text-forest border border-charcoal-border/60">
                          <Armchair className="w-3 h-3 text-terracotta" />
                          {item.seat_number}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold">
                        {item.passenger_name}
                      </td>
                      <td className="px-5 py-3.5 text-charcoal-muted">
                        {item.passenger_age} yrs • {item.passenger_gender}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-forest">
                        {item.pnr}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-charcoal-muted">
                        {item.contact_phone}
                      </td>
                      <td className="px-5 py-3.5 font-bold">
                        {formatCurrency(item.fare_at_booking)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isConfirmed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                            Cancelled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-charcoal-muted">
            {searchTerm ? "No passengers match your search criteria." : "No bookings recorded for this departure yet."}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OperatorManifestsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        </div>
      }
    >
      <OperatorManifestsContent />
    </Suspense>
  );
}
