import React from "react";
import Link from "next/link";
import { ReportService } from "@/services/report-service";
import { OperatorService } from "@/services/operator-service";
import { TripService } from "@/services/trip-service";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bus,
  Users,
  TrendingUp,
  Map,
  Calendar,
  FileSpreadsheet,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default async function OperatorDashboardPage() {
  const [vehicles, routes, trips, reports] = await Promise.all([
    OperatorService.getVehicles(),
    OperatorService.getRoutes(),
    TripService.getAllTrips(),
    ReportService.getOccupancyReports(),
  ]);

  const totalSeats = reports.reduce((sum, r) => sum + r.total_seats, 0);
  const bookedSeats = reports.reduce((sum, r) => sum + r.booked_seats, 0);
  const grossRevenue = reports.reduce((sum, r) => sum + r.gross_revenue, 0);
  const netRevenue = reports.reduce((sum, r) => sum + r.net_revenue, 0);
  const avgOccupancy = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Operator Management Portal
            </h1>
            <Badge variant="default" className="text-xs bg-blue-600">
              Operations Active
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch control, real-time passenger manifests, vehicle inventory, and occupancy reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/operator/manifests">
            <Button variant="outline" size="sm" className="font-semibold text-xs gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" /> View Manifests
            </Button>
          </Link>
          <Link href="/operator/reports">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5">
              <TrendingUp className="w-4 h-4" /> Financial Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400 flex items-center justify-between">
              <span>Fleet Vehicles</span>
              <Bus className="w-4 h-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {vehicles.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Active registered buses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400 flex items-center justify-between">
              <span>Network Routes</span>
              <Map className="w-4 h-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {routes.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Intercity corridors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400 flex items-center justify-between">
              <span>Occupancy Rate</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-indigo-600">
              {avgOccupancy}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {bookedSeats} of {totalSeats} seats booked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400 flex items-center justify-between">
              <span>Net Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">
              {formatCurrency(netRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Reconciled ticket sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Operator Navigation Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/operator/manifests" className="group">
          <Card className="h-full hover:border-blue-500 transition-all hover:shadow-md cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 group-hover:text-blue-600">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                Passenger Manifests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 leading-relaxed">
                Generate printable boarding passenger lists for upcoming departures. Reconcile verified seats and passenger emergency contacts.
              </p>
              <div className="mt-4 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                Open Manifest Table →
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/operator/reports" className="group">
          <Card className="h-full hover:border-emerald-500 transition-all hover:shadow-md cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 group-hover:text-emerald-600">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Seat Occupancy Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 leading-relaxed">
                Track revenue, cancellation charge retainment, refund deductions, and seat occupancy percentages trip by trip.
              </p>
              <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
                View Occupancy Analytics →
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/operator/vehicles" className="group">
          <Card className="h-full hover:border-purple-500 transition-all hover:shadow-md cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 group-hover:text-purple-600">
                <Bus className="w-5 h-5 text-purple-600" />
                Fleet & Route Config
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 leading-relaxed">
                Configure bus models, multi-deck seat layouts (2x2, 2x1 Sleeper), intercity route stops, and schedule new departures.
              </p>
              <div className="mt-4 flex items-center text-xs font-semibold text-purple-600 group-hover:translate-x-1 transition-transform">
                Manage Fleet & Routes →
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Live Trip Scheduling Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Active Scheduled Trips
            </h3>
            <p className="text-xs text-slate-500">
              Live operational departures with real-time seat inventory status.
            </p>
          </div>
          <Link href="/operator/trips">
            <Button size="sm" variant="outline" className="text-xs font-semibold">
              <PlusCircle className="w-4 h-4 mr-1.5" /> Schedule New Trip
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Trip Code</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Departure</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4 text-center">Available Seats</th>
                <th className="py-3 px-4 text-right">Base Fare</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {trips.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-xs text-blue-600">
                    {t.trip_code}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {t.route?.origin_city} → {t.route?.destination_city}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                    {formatDate(t.departure_time)}, {formatTime(t.departure_time)}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                    {t.vehicle?.model} ({t.vehicle?.registration_number})
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={t.available_seats_count === 0 ? "destructive" : "success"}>
                      {t.available_seats_count ?? "--"} / {t.total_seats_count ?? "--"} Left
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
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
    </div>
  );
}
