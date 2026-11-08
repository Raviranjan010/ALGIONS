"use client";

import React, { useEffect, useState } from "react";
import { Trip, Route, Vehicle } from "@/types";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, PlusCircle, ArrowRight, Bus } from "lucide-react";
import Link from "next/link";

export default function OperatorTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [routeId, setRouteId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [tripCode, setTripCode] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [baseFare, setBaseFare] = useState(750);

  const loadData = async () => {
    try {
      const [tripsRes, routesRes, vehiclesRes] = await Promise.all([
        fetch("/api/trips/search?origin=&destination=&date="),
        fetch("/api/operator/routes"),
        fetch("/api/operator/vehicles"),
      ]);
      const tripsData = await tripsRes.json();
      const routesData = await routesRes.json();
      const vehiclesData = await vehiclesRes.json();

      if (tripsData.success) setTrips(tripsData.data);
      if (routesData.success) {
        setRoutes(routesData.data);
        if (routesData.data.length > 0) setRouteId(routesData.data[0].id);
      }
      if (vehiclesData.success) {
        setVehicles(vehiclesData.data);
        if (vehiclesData.data.length > 0) setVehicleId(vehiclesData.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();

    // Default departure time 2 days from now at 09:00 AM
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(9, 0, 0, 0);
    const a = new Date(d);
    a.setHours(a.getHours() + 4);

    setDepartureTime(d.toISOString().slice(0, 16));
    setArrivalTime(a.toISOString().slice(0, 16));
    setTripCode(`RYL-EXP-${Math.floor(100 + Math.random() * 900)}`);
  }, []);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/operator/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: "a1000000-0000-0000-0000-000000000001",
          routeId,
          vehicleId,
          tripCode,
          departureTime: new Date(departureTime).toISOString(),
          arrivalTime: new Date(arrivalTime).toISOString(),
          baseFare: Number(baseFare),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create trip");

      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to schedule trip");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Scheduled Departures
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch management, schedule assignment, and trip inventory tracking.
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5"
        >
          <PlusCircle className="w-4 h-4" /> Schedule New Departure
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Trip Code</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Departure</th>
                <th className="py-3 px-4">Arrival</th>
                <th className="py-3 px-4">Assigned Vehicle</th>
                <th className="py-3 px-4 text-center">Available Seats</th>
                <th className="py-3 px-4 text-right">Base Fare</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {trips.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-xs text-blue-600">
                    {t.trip_code}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {t.route?.origin_city} → {t.route?.destination_city}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {formatDate(t.departure_time)} {formatTime(t.departure_time)}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {formatDate(t.arrival_time)} {formatTime(t.arrival_time)}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                    {t.vehicle?.model} ({t.vehicle?.registration_number})
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={t.available_seats_count === 0 ? "destructive" : "success"}>
                      {t.available_seats_count ?? "--"} Available
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100">
                    {formatCurrency(t.base_fare)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/operator/manifests?tripId=${t.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-blue-600 font-semibold">
                        Manifest
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Schedule New Bus Departure
            </h3>

            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <Label className="text-xs">Trip Identifier Code</Label>
                <Input
                  required
                  placeholder="e.g. RYL-EXP-777"
                  value={tripCode}
                  onChange={(e) => setTripCode(e.target.value)}
                  className="mt-1 uppercase font-mono"
                />
              </div>

              <div>
                <Label className="text-xs">Select Route</Label>
                <select
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                  className="w-full mt-1 h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 text-sm"
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.route_number}: {r.origin_city} to {r.destination_city} ({r.distance_km} km)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Assign Vehicle</Label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full mt-1 h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 text-sm"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.model} ({v.registration_number}) — {v.total_capacity} seats
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Departure Date & Time</Label>
                  <Input
                    type="datetime-local"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Arrival Date & Time</Label>
                  <Input
                    type="datetime-local"
                    required
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Base Fare (₹)</Label>
                <Input
                  type="number"
                  min="50"
                  required
                  value={baseFare}
                  onChange={(e) => setBaseFare(Number(e.target.value))}
                  className="mt-1 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-blue-600 text-white font-semibold"
                >
                  {submitting ? "Scheduling..." : "Confirm Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

