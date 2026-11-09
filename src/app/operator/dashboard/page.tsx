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
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-charcoal-border/70 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-charcoal">
              Operator Management Portal
            </h1>
            <Badge variant="sage" className="text-xs">
              Operations Active
            </Badge>
          </div>
          <p className="text-xs text-charcoal-muted mt-1">
            Dispatch control, real-time passenger manifests, vehicle inventory, and occupancy reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/operator/manifests">
            <Button variant="outline" size="sm" className="font-bold text-xs gap-1.5 rounded-xl border-charcoal-border">
              <FileSpreadsheet className="w-4 h-4 text-forest" /> View Manifests
            </Button>
          </Link>
          <Link href="/operator/reports">
            <Button size="sm" className="font-bold text-xs gap-1.5 bg-terracotta text-white rounded-xl shadow-xs">
              <TrendingUp className="w-4 h-4" /> Financial Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Gross Revenue */}
        <Card className="rounded-3xl border-charcoal-border/80 shadow-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
              Gross Revenue
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-ivory-soft text-forest flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-charcoal">
              {formatCurrency(grossRevenue)}
            </div>
            <p className="text-[11px] text-charcoal-muted mt-1">
              Before cancellation adjustments
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Net Revenue */}
        <Card className="rounded-3xl border-charcoal-border/80 shadow-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
              Net Settled Revenue
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-terracotta-light text-terracotta flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-terracotta">
              {formatCurrency(netRevenue)}
            </div>
            <p className="text-[11px] text-charcoal-muted mt-1">
              Confirmed tickets retained
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Occupancy Rate */}
        <Card className="rounded-3xl border-charcoal-border/80 shadow-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
              Average Occupancy
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-sage-surface text-forest flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-forest">
              {avgOccupancy}%
            </div>
            <p className="text-[11px] text-charcoal-muted mt-1">
              {bookedSeats} of {totalSeats} seats allocated
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Fleet & Routes */}
        <Card className="rounded-3xl border-charcoal-border/80 shadow-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
              Active Inventory
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-ivory-soft text-charcoal flex items-center justify-center">
              <Bus className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-charcoal">
              {vehicles.length} Buses
            </div>
            <p className="text-[11px] text-charcoal-muted mt-1">
              Across {routes.length} intercity routes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Schedules Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-charcoal">
            Active Scheduled Departures ({trips.length})
          </h2>
          <span className="text-xs text-charcoal-muted">
            Real-time status synchronized with live database
          </span>
        </div>

        <div className="rounded-3xl border border-charcoal-border/80 bg-white overflow-hidden shadow-warm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-soft text-charcoal font-bold uppercase tracking-wider border-b border-charcoal-border/70">
                <tr>
                  <th className="px-5 py-3.5">Route</th>
                  <th className="px-5 py-3.5">Vehicle</th>
                  <th className="px-5 py-3.5">Departure</th>
                  <th className="px-5 py-3.5">Available Seats</th>
                  <th className="px-5 py-3.5">Fare</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/50 text-charcoal">
                {trips.map((t) => (
                  <tr key={t.id} className="hover:bg-ivory-light transition-colors">
                    <td className="px-5 py-4 font-bold">
                      {t.route?.origin_city} → {t.route?.destination_city}
                    </td>
                    <td className="px-5 py-4 text-charcoal-muted">
                      {t.vehicle?.model} ({t.vehicle?.registration_number})
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-charcoal">{formatTime(t.departure_time)}</span>
                      <span className="text-charcoal-muted block text-[11px]">
                        {formatDate(t.departure_time)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-forest">
                        {t.available_seats_count ?? 24} left
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold">
                      {formatCurrency(t.base_fare)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/operator/manifests?tripId=${t.id}`}>
                        <Button variant="outline" size="sm" className="text-xs font-semibold rounded-xl border-charcoal-border">
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
    </div>
  );
}
