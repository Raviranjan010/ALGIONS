"use client";

import React, { useEffect, useState } from "react";
import { Vehicle, Operator } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bus, PlusCircle, CheckCircle2, ShieldAlert } from "lucide-react";

export default function OperatorVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [operatorId, setOperatorId] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [model, setModel] = useState("Volvo 9600 Multi-Axle");
  const [layoutType, setLayoutType] = useState<"2x2" | "2x1" | "sleeper_2x1" | "executive_2x2">("sleeper_2x1");
  const [totalCapacity, setTotalCapacity] = useState(30);

  const loadData = async () => {
    try {
      const res = await fetch("/api/operator/vehicles");
      const data = await res.json();
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    // Use demo operator
    setOperatorId("a1000000-0000-0000-0000-000000000001");
  }, []);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/operator/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId,
          registrationNumber,
          model,
          layoutType,
          totalCapacity: Number(totalCapacity),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create vehicle");

      setShowModal(false);
      setRegistrationNumber("");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bus className="w-6 h-6 text-blue-600" />
            Fleet Vehicle Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure bus fleet, layouts, seat blueprints, and capacity specs.
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5"
        >
          <PlusCircle className="w-4 h-4" /> Add New Vehicle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((v) => (
          <div
            key={v.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded">
                {v.registration_number}
              </span>
              <Badge variant={v.is_active ? "success" : "secondary"}>
                {v.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {v.model}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Layout: <span className="uppercase font-semibold">{v.layout_type}</span>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Seating Capacity:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {v.total_capacity} Berths / Seats
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Register New Fleet Vehicle
            </h3>

            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div>
                <Label className="text-xs">Registration Number</Label>
                <Input
                  required
                  placeholder="e.g. MH-02-CD-9999"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="mt-1 uppercase font-mono"
                />
              </div>

              <div>
                <Label className="text-xs">Bus Make & Model</Label>
                <Input
                  required
                  placeholder="e.g. Scania Multi-Axle HD"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Seating Layout</Label>
                <select
                  value={layoutType}
                  onChange={(e) => setLayoutType(e.target.value as any)}
                  className="w-full mt-1 h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 text-sm"
                >
                  <option value="sleeper_2x1">2x1 AC Sleeper (Lower/Upper)</option>
                  <option value="2x2">2x2 Standard Executive Seater</option>
                  <option value="2x1">2x1 Semi-Sleeper Luxury</option>
                  <option value="executive_2x2">2x2 Multi-Axle Coach</option>
                </select>
              </div>

              <div>
                <Label className="text-xs">Total Capacity</Label>
                <Input
                  type="number"
                  min="10"
                  max="60"
                  required
                  value={totalCapacity}
                  onChange={(e) => setTotalCapacity(Number(e.target.value))}
                  className="mt-1"
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
                  {submitting ? "Registering..." : "Create Vehicle"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

