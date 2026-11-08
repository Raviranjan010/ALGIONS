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
  DollarSign,
  Bus,
  Printer,
  Download,
  AlertCircle,
  PieChart,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Occupancy & Revenue Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete financial and load-factor analytics reconciled against active database bookings.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-semibold gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print Financial Summary
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400">
              Fleet Occupancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">
              {overallOccupancy}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {bookedSeats} of {totalSeats} seats filled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400">
              Gross Ticket Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(grossRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Confirmed booking totals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400">
              Simulated Refunds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600">
              {formatCurrency(cancelledRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Policy-based refund adjustments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400">
              Net Operational Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">
              {formatCurrency(netRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Retained transit earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Trip-by-Trip Occupancy & Revenue Breakdown
          </h3>
          <span className="text-xs text-slate-500">{reports.length} Scheduled Trips</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Trip Code</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Departure Time</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4 text-center">Occupancy Rate</th>
                <th className="py-3 px-4 text-right">Gross Sales</th>
                <th className="py-3 px-4 text-right">Refunds</th>
                <th className="py-3 px-4 text-right">Net Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.map((r) => (
                <tr key={r.trip_id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-xs text-blue-600">
                    {r.trip_code}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {r.route_name}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {formatDate(r.departure_time)}, {formatTime(r.departure_time)}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">
                    {r.vehicle_reg}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            r.occupancy_rate >= 75
                              ? "bg-emerald-500"
                              : r.occupancy_rate >= 40
                              ? "bg-blue-600"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${r.occupancy_rate}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs w-10 text-right">
                        {r.occupancy_rate}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                      {r.booked_seats}/{r.total_seats} seats
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(r.gross_revenue)}
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-red-500 font-medium">
                    {r.cancelled_revenue > 0 ? `-${formatCurrency(r.cancelled_revenue)}` : "₹0"}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-emerald-600">
                    {formatCurrency(r.net_revenue)}
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
