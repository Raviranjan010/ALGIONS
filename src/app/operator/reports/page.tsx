"use client";

import React, { useEffect, useState } from "react";
import { OccupancyReport } from "@/types";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  Bus,
  Printer,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export default function OperatorReportsPage() {
  const [reports, setReports] = useState<OccupancyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/operator/reports/occupancy")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setReports(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalSeats = reports.reduce((sum, r) => sum + r.total_seats, 0);
  const bookedSeats = reports.reduce((sum, r) => sum + r.booked_seats, 0);
  const grossRevenue = reports.reduce((sum, r) => sum + r.gross_revenue, 0);
  const cancelledRevenue = reports.reduce((sum, r) => sum + r.cancelled_revenue, 0);
  const netRevenue = reports.reduce((sum, r) => sum + r.net_revenue, 0);
  const overallOccupancy = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-charcoal-border/70 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-terracotta" />
            Occupancy & Revenue Reconciliation
          </h1>
          <p className="text-xs text-charcoal-muted mt-1">
            Complete financial and load-factor analytics reconciled against active database bookings.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold gap-1.5 rounded-xl border-charcoal-border"
          >
            <Printer className="w-4 h-4" /> Print Statement
          </Button>
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="rounded-3xl border-charcoal-border/80 shadow-warm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
              Gross Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-charcoal">
              {formatCurrency(grossRevenue)}
            </div>
            <p className="text-[11px] text-charcoal-muted mt-1">
              All reservations processed
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-charcoal-border/80 shadow-warm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
              Refunds / Cancellations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-600">
              {formatCurrency(cancelledRevenue)}
            </div>
            <p className="text-[11px] text-charcoal-muted mt-1">
              Policy-driven refunds simulated
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-charcoal-border/80 shadow-warm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
              Net Settled Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-terracotta">
              {formatCurrency(netRevenue)}
            </div>
            <p className="text-[11px] text-charcoal-muted mt-1">
              Retained operator revenue
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-charcoal-border/80 shadow-warm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
              Fleet Occupancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-forest">
              {overallOccupancy}%
            </div>
            <p className="text-[11px] text-charcoal-muted mt-1">
              {bookedSeats} / {totalSeats} seats occupied
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Route-by-Route Breakdown Table */}
      <div className="bg-white rounded-3xl border border-charcoal-border/80 overflow-hidden shadow-warm">
        <div className="p-5 border-b border-charcoal-border/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-charcoal">
            Departure Occupancy & Financial Breakdown ({reports.length} Trips)
          </h2>
          <span className="text-[11px] text-charcoal-muted">
            Includes both confirmed & released seats
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-terracotta" />
            <span className="text-xs text-charcoal-muted font-medium">Reconciling financial ledgers...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-soft text-charcoal font-bold uppercase tracking-wider border-b border-charcoal-border/70">
                <tr>
                  <th className="px-5 py-3.5">Trip Code</th>
                  <th className="px-5 py-3.5">Route</th>
                  <th className="px-5 py-3.5">Departure</th>
                  <th className="px-5 py-3.5">Load Factor</th>
                  <th className="px-5 py-3.5">Gross Revenue</th>
                  <th className="px-5 py-3.5">Refunds</th>
                  <th className="px-5 py-3.5 text-right">Net Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/50 text-charcoal">
                {reports.map((report) => {
                  const rate = Math.round(report.occupancy_rate || 0);
                  return (
                    <tr key={report.trip_id} className="hover:bg-ivory-light transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-forest">
                        {report.trip_code}
                      </td>
                      <td className="px-5 py-4 font-bold">
                        {report.origin_city} → {report.destination_city}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-charcoal">{formatTime(report.departure_time)}</span>
                        <span className="text-charcoal-muted block text-[11px]">
                          {formatDate(report.departure_time)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span>{report.booked_seats} / {report.total_seats}</span>
                            <span className={rate > 70 ? "text-forest" : "text-charcoal-muted"}>
                              {rate}%
                            </span>
                          </div>
                          <div className="w-24 h-1.5 rounded-full bg-ivory-soft overflow-hidden">
                            <div
                              className="h-full bg-forest rounded-full"
                              style={{ width: `${Math.min(rate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold">
                        {formatCurrency(report.gross_revenue)}
                      </td>
                      <td className="px-5 py-4 text-red-600 font-medium">
                        {formatCurrency(report.cancelled_revenue)}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-terracotta">
                        {formatCurrency(report.net_revenue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
