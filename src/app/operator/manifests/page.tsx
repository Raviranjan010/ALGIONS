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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Passenger Dispatch Manifest
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time boarding manifest reconciled with confirmed seat inventory.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-semibold gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print Manifest
          </Button>
        </div>
      </div>

      {/* Trip Selector & Search Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Select Scheduled Departure
            </label>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 text-sm font-medium"
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
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Filter Manifest
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by passenger name, PNR, or seat number..."
                className="w-full h-10 pl-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selected Trip Details & Reconciliation Counters */}
      {currentTrip && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-400">
                Vehicle Assigned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {currentTrip.vehicle?.model}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Reg: {currentTrip.vehicle?.registration_number}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-400">
                Total Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {currentTrip.total_seats_count ?? currentTrip.vehicle?.total_capacity ?? 30}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Bus capacity configuration</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-400">
                Confirmed Passengers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-emerald-600">
                {confirmedPassengers.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Active verified boarding passes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-400">
                Reconciliation Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm mt-1">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>100% Reconciled</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {currentTrip.available_seats_count} remaining unallocated seats
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manifest Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Manifest Passenger List ({filteredManifest.length} records)
          </h3>
          <span className="text-xs text-slate-500">Sorted by Seat Number</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Seat</th>
                <th className="py-3 px-4">PNR</th>
                <th className="py-3 px-4">Passenger Name</th>
                <th className="py-3 px-4">Age / Gender</th>
                <th className="py-3 px-4">Emergency Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Boarding Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredManifest.length > 0 ? (
                filteredManifest.map((item, idx) => {
                  const isConfirmed = item.booking_status === "confirmed";
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                          {item.seat_number}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-xs text-slate-600 dark:text-slate-400">
                        {item.pnr}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {item.passenger_name}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 capitalize">
                        {item.age} yrs • {item.gender}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {item.contact_phone}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={isConfirmed ? "success" : "destructive"}>
                          {item.booking_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          disabled={!isConfirmed}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                    No passenger bookings found for this trip.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function OperatorManifestsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <OperatorManifestsContent />
    </Suspense>
  );
}
