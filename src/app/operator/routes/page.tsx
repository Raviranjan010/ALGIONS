"use client";

import React, { useEffect, useState } from "react";
import { Route } from "@/types";
import { formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Map, PlusCircle, ArrowRight } from "lucide-react";

export default function OperatorRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [routeNumber, setRouteNumber] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [distanceKm, setDistanceKm] = useState(200);
  const [estimatedDurationMins, setEstimatedDurationMins] = useState(240);

  const loadData = async () => {
    try {
      const res = await fetch("/api/operator/routes");
      const data = await res.json();
      if (data.success) setRoutes(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/operator/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: "a1000000-0000-0000-0000-000000000001",
          routeNumber,
          originCity,
          destinationCity,
          distanceKm: Number(distanceKm),
          estimatedDurationMins: Number(estimatedDurationMins),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create route");

      setShowModal(false);
      setRouteNumber("");
      setOriginCity("");
      setDestinationCity("");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create route");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Map className="w-6 h-6 text-emerald-600" />
            Transit Route Corridors
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure origin-destination routes, transit distance, and estimated travel durations.
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
        >
          <PlusCircle className="w-4 h-4" /> Create Route
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map((r) => (
          <div
            key={r.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded">
                {r.route_number}
              </span>
              <Badge variant={r.is_active ? "success" : "secondary"}>
                {r.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {r.origin_city}
              </span>
              <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {r.destination_city}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>{r.distance_km} km</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Approx. {formatDuration(r.estimated_duration_mins)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Create Route Corridor
            </h3>

            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div>
                <Label className="text-xs">Route Number / Code</Label>
                <Input
                  required
                  placeholder="e.g. EXP-505"
                  value={routeNumber}
                  onChange={(e) => setRouteNumber(e.target.value)}
                  className="mt-1 uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Origin City</Label>
                  <Input
                    required
                    placeholder="e.g. Pune"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Destination City</Label>
                  <Input
                    required
                    placeholder="e.g. Goa"
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Distance (km)</Label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Duration (mins)</Label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={estimatedDurationMins}
                    onChange={(e) => setEstimatedDurationMins(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
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
                  className="bg-emerald-600 text-white font-semibold"
                >
                  {submitting ? "Saving..." : "Create Route"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
