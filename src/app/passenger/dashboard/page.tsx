"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Booking } from "@/types";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Ticket,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Bus,
} from "lucide-react";

export default function PassengerDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/passenger/bookings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBookings(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");
  const totalSpent = confirmedBookings.reduce((sum, b) => sum + Number(b.total_fare), 0);
  const totalRefunded = cancelledBookings.reduce(
    (sum, b) => sum + Number(b.cancellation?.refund_amount || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Passenger Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal travel itineraries, download e-tickets, and track refund credits.
          </p>
        </div>

        <Link href="/search">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow">
            <Bus className="w-4 h-4" /> Book New Journey
          </Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {bookings.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Across all operators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400">
              Active Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">
              {confirmedBookings.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Confirmed reservations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400">
              Total Fares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Confirmed booking value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400">
              Simulated Refunds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">
              {formatCurrency(totalRefunded)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Processed under cancellation policy</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Bookings Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Upcoming Journeys
          </h2>
          <Link href="/passenger/bookings">
            <Button variant="ghost" size="sm" className="text-xs font-semibold text-blue-600">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {confirmedBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confirmedBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    PNR: {b.pnr}
                  </span>
                  <Badge variant="success">Confirmed</Badge>
                </div>

                <div className="flex items-center justify-between text-sm pt-1">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {b.trip?.route?.origin_city || "Origin"}
                    </span>
                    <p className="text-xs text-slate-500">
                      {b.trip ? formatTime(b.trip.departure_time) : ""}
                    </p>
                  </div>
                  <div className="text-slate-300 text-xs">━━━►</div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {b.trip?.route?.destination_city || "Destination"}
                    </span>
                    <p className="text-xs text-slate-500">
                      {b.trip ? formatTime(b.trip.arrival_time) : ""}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Seats: {b.passengers?.map((p) => p.seat_number).join(", ")}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(b.total_fare)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No upcoming journeys scheduled. Search and book your next trip!
          </div>
        )}
      </div>
    </div>
  );
}
